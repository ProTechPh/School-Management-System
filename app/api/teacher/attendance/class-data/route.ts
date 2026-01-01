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

    const { classId, date } = await request.json()

    if (!classId || !date) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // 1. Verify ownership of the class
    const { data: classData } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", classId)
      .single()

    if (!classData || classData.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this class" }, { status: 403 })
    }

    // 2. Fetch enrolled students
    const { data: enrollments } = await supabase
      .from("class_students")
      .select(`
        student:users!class_students_student_id_fkey (id, name, email, avatar)
      `)
      .eq("class_id", classId)

    const students = enrollments?.map((e: any) => e.student) || []

    // 3. Fetch attendance records for this date
    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .eq("class_id", classId)
      .eq("date", date)

    const attendanceMap: Record<string, string> = {}
    records?.forEach((r: any) => {
      attendanceMap[r.student_id] = r.status
    })

    return NextResponse.json({ students, attendance: attendanceMap })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}