import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch student analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
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

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Authorization check
  const isStudent = userData.role === "student" && user.id === studentId
  const isAdmin = userData.role === "admin"
  
  // Check if teacher teaches this student
  let isTeacher = false
  if (userData.role === "teacher") {
    // Get classes taught by this teacher
    const { data: teacherClasses } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", user.id)
    
    const classIds = teacherClasses?.map(c => c.id) || []
    
    if (classIds.length > 0) {
      // Check if student is enrolled in any of teacher's classes
      const { data: enrollment } = await supabase
        .from("class_students")
        .select("id")
        .eq("student_id", studentId)
        .in("class_id", classIds)
        .single()
      
      isTeacher = !!enrollment
    }
  }
  
  // Check if parent has access to this student
  let isParent = false
  if (userData.role === "parent") {
    const { data: relationship } = await supabase
      .from("parent_children")
      .select("id")
      .eq("parent_id", user.id)
      .eq("student_id", studentId)
      .single()
    
    isParent = !!relationship
  }

  if (!isStudent && !isTeacher && !isAdmin && !isParent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Fetch grades for trends
    const { data: grades } = await supabase
      .from("grades")
      .select(`
        score,
        date,
        type,
        class:classes(subject)
      `)
      .eq("student_id", studentId)
      .order("date", { ascending: true })

    // Fetch attendance for trends
    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("date, status")
      .eq("student_id", studentId)
      .order("date", { ascending: true })

    // Calculate grade trends
    const gradeTrends = grades?.map((g: any) => ({
      date: g.date,
      grade: g.score,
      subject: g.class?.subject || "Unknown",
      type: g.type,
    })) || []

    // Calculate attendance trends
    const attendanceTrends = attendance?.map((a) => ({
      date: a.date,
      status: a.status,
    })) || []

    // Calculate subject performance
    const subjectMap = new Map<string, number[]>()
    grades?.forEach((g: any) => {
      const subject = g.class?.subject || "Unknown"
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, [])
      }
      subjectMap.get(subject)!.push(g.score)
    })

    const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, scores]) => ({
      subject,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      count: scores.length,
    }))

    // Calculate overall average
    const allScores = grades?.map((g) => g.score) || []
    const overallAverage = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0

    // Calculate attendance rate
    const attendanceStats = {
      present: attendance?.filter((a) => a.status === "present").length || 0,
      late: attendance?.filter((a) => a.status === "late").length || 0,
      total: attendance?.length || 0,
    }
    const attendanceRate = attendanceStats.total > 0
      ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
      : 0

    // Calculate improvement rate (last 5 vs previous 5 grades)
    let improvementRate = 0
    if (allScores.length >= 10) {
      const recent = allScores.slice(-5)
      const previous = allScores.slice(-10, -5)
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
      const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length
      improvementRate = Math.round(recentAvg - previousAvg)
    }

    return NextResponse.json({
      gradeTrends,
      attendanceTrends,
      subjectPerformance,
      overallAverage,
      attendanceRate,
      improvementRate,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
