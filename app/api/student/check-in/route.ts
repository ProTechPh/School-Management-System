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

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
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
    const { qrData, latitude, longitude } = body

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

    // Check if QR code is expired (Strict 5s window)
    // This physical proximity constraint is our primary defense against remote check-ins (replay attacks)
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

    // 5. Location Verification
    if (session.require_location) {
      let locationVerified = false;

      // 5a. IP Check (Primary - Secure)
      const allowedIps = process.env.SCHOOL_IP_ADDRESS 
      
      if (allowedIps) {
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

        if (isAllowed) {
          locationVerified = true;
        } else {
          // Strict enforcement: If IP whitelist is configured, fail immediately if no match.
          // Do not fallback to GPS if IP restriction is active, as GPS is easily spoofed.
          return NextResponse.json({ 
            error: "Location verification failed: You must be connected to the school network (Wi-Fi)." 
          }, { status: 403 })
        }
      }

      // 5b. GPS Check (Secondary / Advisory)
      // Only used if SCHOOL_IP_ADDRESS is NOT set.
      // We accept GPS here, but since it can be spoofed, the primary security
      // comes from the 5-second QR code rotation verified above.
      if (!locationVerified) {
        if (!latitude || !longitude) {
          return NextResponse.json({ error: "GPS location is required for this session." }, { status: 400 })
        }

        const { data: schoolSettings } = await supabase
          .from("school_settings")
          .select("latitude, longitude, radius_meters")
          .single()
        
        const schoolLat = schoolSettings?.latitude || 14.5995
        const schoolLng = schoolSettings?.longitude || 120.9842
        const radius = schoolSettings?.radius_meters || 500

        const distance = calculateDistance(latitude, longitude, schoolLat, schoolLng)

        if (distance > radius) {
          return NextResponse.json({ 
            error: `You are too far from school (${Math.round(distance)}m). Must be within ${radius}m.` 
          }, { status: 403 })
        }
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