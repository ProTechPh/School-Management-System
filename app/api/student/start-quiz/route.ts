import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { quizId } = body

    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 })
    }

    // Check if attempt already exists
    const { data: existingAttempt } = await supabase
      .from("quiz_attempts")
      .select("id, completed_at")
      .eq("quiz_id", quizId)
      .eq("student_id", user.id)
      .single()

    if (existingAttempt) {
      if (existingAttempt.completed_at) {
        return NextResponse.json({ error: "Quiz already submitted" }, { status: 400 })
      }
      // If continuing an attempt, we also need to return questions
      // In a real app, we might check if they are allowed to resume
    }

    // Verify quiz availability
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("status")
      .eq("id", quizId)
      .single()

    if (!quiz || quiz.status !== "published") {
      return NextResponse.json({ error: "Quiz not available" }, { status: 400 })
    }

    let attemptId = existingAttempt?.id

    if (!existingAttempt) {
      // Create new attempt (this sets created_at which acts as start_time)
      const { data: newAttempt, error } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quizId,
          student_id: user.id,
          score: 0,
          max_score: 0,
          percentage: 0,
          needs_grading: true,
          // created_at is set automatically by DB default
        })
        .select("id")
        .single()

      if (error) throw error
      attemptId = newAttempt.id
    }

    // Security Fix: Fetch questions only now
    const { data: questions, error: qError } = await supabase
      .from("quiz_questions")
      .select("id, question, type, options, points, sort_order")
      .eq("quiz_id", quizId)
      .order("sort_order")

    if (qError) throw qError

    // Sanitize questions (ensure no correct answers leaked)
    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      points: q.points
    }))

    return NextResponse.json({ 
      success: true, 
      attemptId: attemptId,
      questions: sanitizedQuestions
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}