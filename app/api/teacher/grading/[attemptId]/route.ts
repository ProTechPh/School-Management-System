import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify Teacher/Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "teacher" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { attemptId } = await params

    // 1. Fetch Attempt & Verify Ownership
    // We join with quiz to check the teacher_id
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select(`
        id, quiz_id, student_id, score, max_score, percentage, 
        tab_switches, copy_paste_count, exit_attempts,
        quiz:quizzes (teacher_id)
      `)
      .eq("id", attemptId)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    // Strict Ownership Check: Only the quiz creator (teacher) or admin can view details
    // Handle Supabase returning array for joined relation
    const quizData = attempt.quiz as any
    const quizTeacherId = Array.isArray(quizData) ? quizData[0]?.teacher_id : quizData?.teacher_id

    if (userData.role === "teacher" && quizTeacherId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this quiz" }, { status: 403 })
    }

    // 2. Fetch Answers with Question Details
    const { data: answers, error: answersError } = await supabase
      .from("quiz_attempt_answers")
      .select(`
        id, attempt_id, question_id, answer, is_correct, points_awarded,
        question:quiz_questions (
          id, question, type, options, correct_answer, points
        )
      `)
      .eq("attempt_id", attemptId)

    if (answersError) throw answersError

    // 3. Fetch Activity Logs
    const { data: logs, error: logsError } = await supabase
      .from("quiz_activity_logs")
      .select("id, event_type, details, created_at")
      .eq("attempt_id", attemptId)
      .order("created_at", { ascending: true })

    if (logsError) throw logsError

    return NextResponse.json({
      attempt,
      answers,
      logs
    })

  } catch (error: any) {
    console.error("Grading API Error:", error)
    return NextResponse.json({ error: "Failed to update grade." }, { status: 500 })
  }
}