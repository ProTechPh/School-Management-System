import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"

// Haversine formula to calculate distance
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

  return R * c
}

export async function POST(request: Request) {
  try {
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

    // Force environment variable configuration
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

    // Check if QR code is expired
    const now = Date.now()
    const qrAge = now - timestamp
    
    // Allow 10 seconds validity window
    if (qrAge > 10000 || qrAge < -5000) { 
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

    // 3. SECURITY FIX: Verify Enrollment
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

    // 5. Server-side Location Verification
    if (session.require_location) {
      if (!latitude || !longitude) {
        return NextResponse.json({ error: "Location required" }, { status: 400 })
      }

      const { data: settings } = await supabase
        .from("school_settings")
        .select("latitude, longitude, radius_meters")
        .single()

      const schoolLocation = {
        latitude: settings?.latitude || 14.5995,
        longitude: settings?.longitude || 120.9842,
        radiusMeters: settings?.radius_meters || 500
      }

      const distance = calculateDistance(latitude, longitude, schoolLocation.latitude, schoolLocation.longitude)
      
      if (distance > schoolLocation.radiusMeters) {
        return NextResponse.json({ 
          error: `Location check failed. You are ${Math.round(distance)}m away (max ${schoolLocation.radiusMeters}m).` 
        }, { status: 400 })
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