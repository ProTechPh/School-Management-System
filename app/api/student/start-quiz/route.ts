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
      return NextResponse.json({ success: true, attemptId: existingAttempt.id })
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

    return NextResponse.json({ success: true, attemptId: newAttempt.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}