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

    // 2. Fetch quizzes with questions
    const { data: quizData, error } = await supabase
      .from("quizzes")
      .select(`
        id, title, description, duration, due_date, teacher_id, class_id,
        class:classes (name),
        questions:quiz_questions (id, question, type, options, points, sort_order)
      `)
      .in("class_id", classIds)
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (error) throw error

    // 3. Sanitize data (Double check that correct_answer is not present)
    // Note: The select query above explicitly excludes 'correct_answer', 
    // but we map it here to be absolutely sure and handle sort order.
    const sanitizedQuizzes = quizData.map(q => ({
      ...q,
      questions: ((q.questions as any) || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((question: any) => {
          // Explicitly reconstruct question object to ensure no extra fields leak
          return {
            id: question.id,
            question: question.question,
            type: question.type,
            options: question.options,
            points: question.points
          }
        })
    }))

    return NextResponse.json({ quizzes: sanitizedQuizzes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}