import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Fetch User Profile
    const { data: userData } = await supabase
      .from("users")
      .select("name, role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Fetch Enrolled Classes
    const { data: enrollments } = await supabase
      .from("class_students")
      .select(`
        class:classes (
          id, name, subject, schedule, room,
          teacher:users!classes_teacher_id_fkey (name)
        )
      `)
      .eq("student_id", user.id)

    const classes = enrollments?.map((e: any) => ({
      id: e.class.id,
      name: e.class.name,
      subject: e.class.subject,
      schedule: e.class.schedule,
      room: e.class.room,
      teacher_name: e.class.teacher?.name || null,
    })) || []

    const classIds = classes.map(c => c.id)

    // 3. Fetch Today's Schedule
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const today = days[new Date().getDay()]
    let todaySchedule: any[] = []

    if (classIds.length > 0) {
      const { data: scheduleData } = await supabase
        .from("schedules")
        .select(`
          id, start_time, end_time, room,
          class:classes (name, teacher:users!classes_teacher_id_fkey (name))
        `)
        .in("class_id", classIds)
        .eq("day", today)
        .order("start_time")

      if (scheduleData) {
        todaySchedule = scheduleData.map((s: any) => ({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
          room: s.room,
          class_name: s.class?.name || "Unknown",
          teacher_name: s.class?.teacher?.name || null,
        }))
      }
    }

    // 4. Fetch Recent Grades
    const { data: gradeData } = await supabase
      .from("grades")
      .select(`
        id, score, max_score, grade, type,
        class:classes (name)
      `)
      .eq("student_id", user.id)
      .order("date", { ascending: false })
      .limit(5)

    const grades = gradeData?.map((g: any) => ({
      id: g.id,
      class_name: g.class?.name || "Unknown",
      type: g.type,
      score: g.score,
      max_score: g.max_score,
      grade: g.grade,
    })) || []

    // 5. Calculate Attendance Rate
    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("student_id", user.id)

    let attendanceRate = 100
    if (attendance && attendance.length > 0) {
      const present = attendance.filter((a: any) => a.status === "present").length
      attendanceRate = Math.round((present / attendance.length) * 100)
    }

    return NextResponse.json({
      userName: userData.name,
      classes,
      todaySchedule,
      grades,
      attendanceRate
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}