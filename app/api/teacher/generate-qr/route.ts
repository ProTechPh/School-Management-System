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

    // Optional: Check if user is a teacher/admin
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

    const timestamp = Date.now()
    // In production, use a long, random string from process.env.QR_SECRET
    const secret = process.env.QR_SECRET || "default-secure-secret-key-change-in-prod"
    
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