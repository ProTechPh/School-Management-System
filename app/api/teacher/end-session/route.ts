import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify Teacher Role
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

    // Verify ownership (if teacher)
    if (userData.role === "teacher") {
      const { data: session } = await supabase
        .from("qr_attendance_sessions")
        .select("teacher_id")
        .eq("id", sessionId)
        .single()
      
      if (!session || session.teacher_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: You do not own this session" }, { status: 403 })
      }
    }

    // Perform Update
    const { error } = await supabase
      .from("qr_attendance_sessions")
      .update({ status: "expired" })
      .eq("id", sessionId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}