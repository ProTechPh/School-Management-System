import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
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

    if (userData?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch Quizzes (Strictly filtered by teacher_id)
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select(`
        *,
        class:classes (id, name, grade, section),
        questions:quiz_questions (*),
        reopens:quiz_reopens (
          *,
          student:users!quiz_reopens_student_id_fkey (id, name)
        )
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })

    // Fetch Quiz Attempts (Strictly filtered by quizzes owned by teacher)
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        student:users!quiz_attempts_student_id_fkey (id, name),
        quiz:quizzes!inner (teacher_id)
      `)
      .eq("quiz.teacher_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })

    return NextResponse.json({ 
      quizzes: quizzes || [],
      attempts: attempts || []
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}