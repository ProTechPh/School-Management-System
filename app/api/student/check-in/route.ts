import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"

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
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Verify HMAC signature
    const dataToVerify = `${sessionId}:${timestamp}`
    const expectedSignature = crypto.createHmac("sha256", secret).update(dataToVerify).digest("hex")

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid QR code signature" }, { status: 403 })
    }

    // Check if QR code is expired (Strict 5s window)
    const now = Date.now()
    const qrAge = now - timestamp
    
    if (qrAge > 5000 || qrAge < -2000) { 
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

    // 5. SECURITY FIX: Robust Location/Network Verification
    // Removed client-side GPS fallback which is easily spoofed.
    // Now strictly enforcing IP-based validation if location is required.
    if (session.require_location) {
      const allowedIps = process.env.SCHOOL_IP_ADDRESS // Can be comma separated
      
      if (!allowedIps) {
        // Fail securely if configuration is missing but security is requested
        console.error("Security Misconfiguration: SCHOOL_IP_ADDRESS not set but location required.")
        return NextResponse.json({ 
          error: "System configuration error: Location verification is required but not configured. Please contact administrator." 
        }, { status: 500 })
      }

      const clientIp = request.headers.get("x-forwarded-for")?.split(',')[0].trim() || "unknown"
      const allowedList = allowedIps.split(',').map(ip => ip.trim())
      
      // Allow localhost for dev
      const isLocal = clientIp === "::1" || clientIp === "127.0.0.1"
      
      // Check if IP matches any allowed IP or CIDR
      const isAllowed = isLocal || allowedList.some(allowed => isIpInCidr(clientIp, allowed))

      if (!isAllowed) {
          return NextResponse.json({ 
            error: "Network verification failed. You must be connected to the School Wi-Fi to check in." 
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}