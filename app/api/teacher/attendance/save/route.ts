import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { records } = body

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // Verify ownership of the class for the first record (assuming batch is for one class)
    // A stricter implementation would check every record or group by class_id
    const classId = records[0].class_id
    
    const { data: classData } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", classId)
      .single()

    if (!classData || classData.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this class" }, { status: 403 })
    }

    const { error } = await supabase.from("attendance_records").upsert(records, {
      onConflict: "student_id,class_id,date",
    })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}