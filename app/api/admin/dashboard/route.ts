import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { serverCache } from "@/lib/cache"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // 1. Verify Authentication & Role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Use cached dashboard data (30 second TTL)
    const dashboardData = await serverCache(
      `dashboard-${user.id}`,
      async () => {
        // Fetch counts
        const [studentsRes, teachersRes, classesRes] = await Promise.all([
          supabase.from("users").select("id", { count: "exact" }).eq("role", "student"),
          supabase.from("users").select("id", { count: "exact" }).eq("role", "teacher"),
          supabase.from("classes").select("id", { count: "exact" }),
        ])

        // Fetch recent students
        const { data: recentStudents } = await supabase
          .from("users")
          .select("id, name, avatar, student_profiles(grade, section)")
          .eq("role", "student")
          .order("created_at", { ascending: false })
          .limit(5)

        // Fetch recent attendance
        const { data: recentAttendance } = await supabase
          .from("attendance_records")
          .select("id, date, status, student:users!attendance_records_student_id_fkey(name)")
          .order("date", { ascending: false })
          .limit(5)

        // Fetch top grades
        const { data: topGrades } = await supabase
          .from("grades")
          .select("id, score, student:users!grades_student_id_fkey(name), class:classes(subject)")
          .order("score", { ascending: false })
          .limit(5)

        // Fetch classes
        const { data: classes } = await supabase
          .from("classes")
          .select("id, name, subject, room, teacher:users!classes_teacher_id_fkey(name)")
          .limit(6)

        // Get class student counts
        const { data: classCounts } = await supabase
          .from("class_students")
          .select("class_id")

        const countMap: Record<string, number> = {}
        classCounts?.forEach((c: any) => {
          countMap[c.class_id] = (countMap[c.class_id] || 0) + 1
        })

        // Calculate attendance rate
        const { data: attendanceData } = await supabase
          .from("attendance_records")
          .select("status")
        
        const totalRecords = attendanceData?.length || 0
        const presentRecords = attendanceData?.filter((a: any) => a.status === "present").length || 0
        const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100 * 10) / 10 : 0

        // Construct response object
        return {
          totalStudents: studentsRes.count || 0,
          totalTeachers: teachersRes.count || 0,
          totalClasses: classesRes.count || 0,
          attendanceRate,
          recentStudents: recentStudents?.map((s: any) => ({
            id: s.id,
            name: s.name,
            avatar: s.avatar,
            grade: s.student_profiles?.[0]?.grade || "N/A",
            section: s.student_profiles?.[0]?.section || "N/A",
          })) || [],
          recentAttendance: recentAttendance?.map((a: any) => ({
            id: a.id,
            student_name: a.student?.name || "Unknown",
            date: a.date,
            status: a.status,
          })) || [],
          topGrades: topGrades?.map((g: any) => ({
            id: g.id,
            student_name: g.student?.name || "Unknown",
            subject: g.class?.subject || "Unknown",
            score: g.score,
          })) || [],
          classes: classes?.map((c: any) => ({
            id: c.id,
            name: c.name,
            teacher_name: c.teacher?.name || "Unassigned",
            subject: c.subject,
            room: c.room,
            student_count: countMap[c.id] || 0,
          })) || [],
        }
      },
      30000 // 30 second cache
    )

    return NextResponse.json(dashboardData)

  } catch (error: any) {
    console.error("Dashboard API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}