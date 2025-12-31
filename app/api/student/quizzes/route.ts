import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Get student's enrolled classes
    const { data: enrollments } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", user.id)

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ quizzes: [] })
    }

    const classIds = enrollments.map(e => e.class_id)

    // 2. Fetch quizzes WITHOUT questions
    // Security Fix: Do not fetch questions here. They are fetched only when starting the quiz.
    const { data: quizData, error } = await supabase
      .from("quizzes")
      .select(`
        id, title, description, duration, due_date, teacher_id, class_id,
        class:classes (name)
      `)
      .in("class_id", classIds)
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ quizzes: quizData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}