import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch grades
    const { data: gradeData, error } = await supabase
      .from("grades")
      .select(`
        id, student_id, class_id, score, max_score, percentage, grade, type, date,
        student:users!grades_student_id_fkey (name),
        class:classes (name, subject)
      `)
      .order("date", { ascending: false })

    if (error) throw error

    // SECURITY FIX: DTO Pattern
    const safeGrades = gradeData.map((g: any) => ({
      id: g.id,
      student_id: g.student_id,
      student_name: g.student?.name || "Unknown",
      class_id: g.class_id,
      class_name: g.class?.name || "Unknown",
      subject: g.class?.subject || "Unknown",
      score: g.score,
      max_score: g.max_score,
      percentage: g.percentage,
      grade: g.grade,
      type: g.type,
      date: g.date
    }))

    return NextResponse.json({ grades: safeGrades })
  } catch (error: any) {
    console.error("Fetch grades error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}