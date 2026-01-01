import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { checkRateLimit } from "@/lib/rate-limit"

// Helper to parse IPv4 to unsigned 32-bit integer
function ipV4ToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return 0;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// Fix: Proper CIDR matching logic
function isIpInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr;
  
  try {
    const [rangeIp, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    if (bits < 0 || bits > 32) return false;

    const mask = ~(2 ** (32 - bits) - 1);
    const ipNum = ipV4ToNumber(ip);
    const rangeNum = ipV4ToNumber(rangeIp);

    return (ipNum & mask) === (rangeNum & mask);
  } catch (e) {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const isAllowed = await checkRateLimit(ip, "check-in", 10, 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many check-in attempts. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { qrData } = body

    // 1. Decode and Validate QR Data
    let payload
    try {
      const decoded = atob(qrData)
      payload = JSON.parse(decoded)
    } catch (e) {
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
    }

    const { sessionId, timestamp, signature } = payload

    if (!sessionId || !timestamp || !signature) {
      return NextResponse.json({ error: "Invalid QR code data" }, { status: 400 })
    }

    const secret = process.env.QR_SECRET
    if (!secret) {
      console.error("QR_SECRET is not configured")
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }

    // Verify HMAC signature
    const dataToVerify = `${sessionId}:${timestamp}`
    const expectedSignature = crypto.createHmac("sha256", secret).update(dataToVerify).digest("hex")

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid QR code signature" }, { status: 403 })
    }

    // Check if QR code is expired
    // SECURITY FIX: Reduced validity window to 3 seconds to prevent replay attacks
    const now = Date.now()
    const qrAge = now - timestamp
    
    if (qrAge > 3000 || qrAge < -2000) { 
      return NextResponse.json({ error: "QR code expired. Please scan the current code." }, { status: 400 })
    }

    // 2. Get the session details
    const { data: session, error: sessionError } = await supabase
      .from("qr_attendance_sessions")
      .select("id, require_location, class_id, date, status")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 })
    }

    if (session.status !== "active") {
      return NextResponse.json({ error: "Session is not active" }, { status: 400 })
    }

    // 3. Verify Enrollment
    const { data: enrollment } = await supabase
      .from("class_students")
      .select("id")
      .eq("class_id", session.class_id)
      .eq("student_id", user.id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this class." }, { status: 403 })
    }

    // 4. Check existing check-in
    const { data: existing } = await supabase
      .from("qr_checkins")
      .select("id")
      .eq("session_id", sessionId)
      .eq("student_id", user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Already checked in" }, { status: 400 })
    }

    // 5. Location Verification
    if (session.require_location) {
      // SECURITY FIX: Strict IP Enforcement
      // We do NOT trust client-provided GPS coordinates as they can be easily spoofed.
      // We only rely on server-side IP verification.
      
      const allowedIps = process.env.SCHOOL_IP_ADDRESS 
      
      if (!allowedIps) {
        // Fail closed if IP restriction is not configured but location is required
        console.error("Location required but SCHOOL_IP_ADDRESS not set")
        return NextResponse.json({ 
          error: "System Configuration Error: Location verification is required but not configured. Please contact the administrator." 
        }, { status: 500 })
      }

      const realIp = request.headers.get("x-real-ip")
      let clientIp = "unknown"

      if (realIp) {
        clientIp = realIp
      } else {
        const forwardedFor = request.headers.get("x-forwarded-for")
        if (forwardedFor) {
          clientIp = forwardedFor.split(',')[0].trim()
        }
      }
      
      const allowedList = allowedIps.split(',').map(ip => ip.trim())
      const isLocal = clientIp === "::1" || clientIp === "127.0.0.1"
      const isAllowed = isLocal || allowedList.some(allowed => isIpInCidr(clientIp, allowed))

      if (!isAllowed) {
        return NextResponse.json({ 
          error: "Location verification failed: You must be connected to the school network (Wi-Fi) to check in." 
        }, { status: 403 })
      }
    }

    // 6. Perform Insert
    const { error: insertError } = await supabase
      .from("qr_checkins")
      .insert({
        session_id: sessionId,
        student_id: user.id,
        location_verified: true
      })

    if (insertError) throw insertError

    // 7. Update Attendance Record
    const { data: existingAttendance } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("student_id", user.id)
      .eq("class_id", session.class_id)
      .eq("date", session.date)
      .single()

    if (existingAttendance) {
      await supabase
        .from("attendance_records")
        .update({ status: "present" })
        .eq("id", existingAttendance.id)
    } else {
      await supabase
        .from("attendance_records")
        .insert({
          student_id: user.id,
          class_id: session.class_id,
          date: session.date,
          status: "present"
        })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Check-in error:", error)
    return NextResponse.json({ error: "Failed to process check-in." }, { status: 500 })
  }
}