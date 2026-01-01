import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

// Haversine formula to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "check-in", 10, 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many check-in attempts. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Network Fencing (Optional Check)
    // In production, SCHOOL_IP_RANGE would be set. If not set, skip check.
    const schoolIpRange = process.env.SCHOOL_IP_RANGE
    if (schoolIpRange) {
      // Simple check: Does IP start with the allowed range?
      // Real implementation would use CIDR parsing library
      if (!ip.startsWith(schoolIpRange)) {
         return NextResponse.json({ error: "You must be connected to the school Wi-Fi to check in." }, { status: 403 })
      }
    }

    const body = await request.json()
    const { qrData, latitude, longitude } = body

    // 2. Decode and Validate QR Data
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

    // 3. Strict QR Expiry (3 seconds + 2s latency buffer)
    const now = Date.now()
    const qrAge = now - timestamp
    
    if (qrAge > 5000 || qrAge < -2000) { 
      return NextResponse.json({ error: "QR code expired. Please scan the current code." }, { status: 400 })
    }

    // 4. Get the session details
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

    // 5. Verify Enrollment
    const { data: enrollment } = await supabase
      .from("class_students")
      .select("id")
      .eq("class_id", session.class_id)
      .eq("student_id", user.id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this class." }, { status: 403 })
    }

    // 6. Check existing check-in
    const { data: existing } = await supabase
      .from("qr_checkins")
      .select("id")
      .eq("session_id", sessionId)
      .eq("student_id", user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Already checked in" }, { status: 400 })
    }

    // 7. Location Logic (GPS)
    let isSuspiciousLocation = false;

    if (session.require_location) {
      if (latitude === undefined || longitude === undefined) {
        return NextResponse.json({ 
          error: "Location verification required. Please enable GPS." 
        }, { status: 400 })
      }

      const { data: settings } = await supabase
        .from("school_settings")
        .select("latitude, longitude, radius_meters")
        .single()

      if (settings && settings.latitude && settings.longitude) {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          settings.latitude, 
          settings.longitude
        )

        // Suspicious Check: Exact coordinate match (0m distance)
        if (distance < 1) {
           isSuspiciousLocation = true;
        }

        // Basic Geofence Check
        if (distance > settings.radius_meters) {
          return NextResponse.json({ 
            error: `You are too far from the school (${Math.round(distance)}m).` 
          }, { status: 403 })
        }
      }
    }

    // 8. Perform Insert
    const { error: insertError } = await supabase
      .from("qr_checkins")
      .insert({
        session_id: sessionId,
        student_id: user.id,
        location_verified: !isSuspiciousLocation
      })

    if (insertError) throw insertError

    // 9. Update Attendance Record
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