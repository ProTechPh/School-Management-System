import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 2. Verify Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 3. Fetch Data Server-Side (Strict Filtering)
    
    // Fetch Teacher's Classes
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name, grade, section, subject, schedule, room")
      .eq("teacher_id", user.id)
      .order("name")

    const classIds = classes?.map(c => c.id) || []
    
    // Calculate Stats
    let totalStudents = 0
    let attendanceRate = 0
    let students: any[] = []
    let todaySchedule: any[] = []

    if (classIds.length > 0) {
      // Total Students count
      const { count } = await supabase
        .from("class_students")
        .select("*", { count: "exact", head: true })
        .in("class_id", classIds)
      
      totalStudents = count || 0

      // Attendance Rate
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("status")
        .in("class_id", classIds)
      
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter((a: any) => a.status === "present" || a.status === "late").length
        attendanceRate = Math.round((presentCount / attendanceData.length) * 100 * 10) / 10
      }

      // Fetch Students (DTO safe)
      const { data: enrollments } = await supabase
        .from("class_students")
        .select(`
          student:users!class_students_student_id_fkey (id, name, avatar),
          student_profile:student_profiles!class_students_student_id_fkey (grade, section)
        `)
        .in("class_id", classIds)
        .limit(8)

      // Deduplicate students
      const uniqueStudents = new Map()
      enrollments?.forEach((e: any) => {
        const s = e.student
        // Handle the joined profile data correctly depending on query structure
        // Supabase sometimes returns array or object for one-to-one
        const p = Array.isArray(e.student_profile) ? e.student_profile[0] : e.student_profile
        
        if (s && !uniqueStudents.has(s.id)) {
          uniqueStudents.set(s.id, {
            id: s.id,
            name: s.name,
            avatar: s.avatar,
            grade: p?.grade || "N/A",
            section: p?.section || "N/A"
          })
        }
      })
      students = Array.from(uniqueStudents.values()).slice(0, 8)

      // Today's Schedule
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const today = days[new Date().getDay()]

      const { data: scheduleData } = await supabase
        .from("schedules")
        .select(`
          id, day, start_time, end_time, room,
          class:classes!inner (name)
        `)
        .eq("day", today)
        .in("class_id", classIds) // Strict check: must be one of teacher's classes
        .order("start_time")

      if (scheduleData) {
        todaySchedule = scheduleData.map((s: any) => ({
          id: s.id,
          day: s.day,
          start_time: s.start_time,
          end_time: s.end_time,
          room: s.room,
          class_name: s.class?.name || "Unknown"
        }))
      }
    }

    return NextResponse.json({
      classes: classes || [],
      totalStudents,
      attendanceRate,
      students,
      todaySchedule
    })

  } catch (error: any) {
    console.error("Teacher Dashboard API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}