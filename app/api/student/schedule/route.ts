import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 1. Get enrolled classes
    const { data: enrollments } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", user.id)

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ schedule: [] })
    }

    const classIds = enrollments.map(e => e.class_id)

    // 2. Fetch schedule for these classes
    const { data: scheduleData } = await supabase
      .from("schedules")
      .select(`
        id, day, start_time, end_time, room,
        class:classes (name, subject, teacher:users!classes_teacher_id_fkey (name))
      `)
      .in("class_id", classIds)
      .order("day")
      .order("start_time")

    // 3. Transform data
    const schedule = scheduleData?.map((s: any) => ({
      id: s.id,
      day: s.day,
      start_time: s.start_time,
      end_time: s.end_time,
      room: s.room,
      class_name: s.class?.name || "Unknown",
      subject: s.class?.subject || "Unknown",
      teacher_name: s.class?.teacher?.name || null,
    })) || []

    return NextResponse.json({ schedule })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}