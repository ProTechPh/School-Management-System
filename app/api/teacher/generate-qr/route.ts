import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a teacher/admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "teacher" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // SECURITY FIX: IDOR Prevention
    // Verify that the session belongs to the requesting teacher (if they are a teacher)
    const { data: session } = await supabase
      .from("qr_attendance_sessions")
      .select("teacher_id")
      .eq("id", sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Admins can generate for anyone, Teachers only for themselves
    if (userData.role === "teacher" && session.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this session" }, { status: 403 })
    }

    const timestamp = Date.now()
    
    const secret = process.env.QR_SECRET
    if (!secret) {
      console.error("QR_SECRET is not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    // Create HMAC signature
    const payload = `${sessionId}:${timestamp}`
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex")
    
    // Create token
    const tokenData = JSON.stringify({ sessionId, timestamp, signature })
    const token = btoa(tokenData)
    
    return NextResponse.json({ token })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}