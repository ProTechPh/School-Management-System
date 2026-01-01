import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate Limiting
    const isAllowed = await checkRateLimit(user.id, "submit-quiz", 3, 60 * 1000)
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
    }

    const body = await request.json()
    const { quizId, answers, activityLog } = body

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid submission data" }, { status: 400 })
    }

    // 1. Fetch Quiz Details for Grading
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(`
        id, duration, due_date, class_id,
        questions:quiz_questions (
          id, type, points, correct_answer
        )
      `)
      .eq("id", quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // 2. Grade Answers Locally
    let totalScore = 0
    let maxScore = 0
    let hasEssayQuestions = false
    const gradedAnswers = []

    const questionMap = new Map(quiz.questions.map((q: any) => [q.id, q]))

    for (const submission of answers) {
      const question = questionMap.get(submission.questionId)
      if (!question) continue

      let isCorrect = false
      let pointsAwarded = 0
      
      maxScore += question.points

      if (question.type === "multiple-choice" || question.type === "true-false") {
        if (String(submission.answer) === String(question.correct_answer)) {
          isCorrect = true
          pointsAwarded = question.points
        }
      } else if (question.type === "identification") {
        const studentAns = String(submission.answer).trim().toLowerCase()
        const correctAns = String(question.correct_answer).trim().toLowerCase()
        if (studentAns === correctAns) {
          isCorrect = true
          pointsAwarded = question.points
        }
      } else if (question.type === "essay") {
        hasEssayQuestions = true
        isCorrect = false
        pointsAwarded = 0
      }

      totalScore += pointsAwarded

      gradedAnswers.push({
        question_id: question.id,
        answer: String(submission.answer),
        is_correct: isCorrect,
        points_awarded: pointsAwarded
      })
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    // 3. Atomic Submission via RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('submit_quiz_attempt', {
      p_quiz_id: quizId,
      p_student_id: user.id,
      p_score: totalScore,
      p_max_score: maxScore,
      p_percentage: percentage,
      p_needs_grading: hasEssayQuestions,
      p_tab_switches: activityLog?.tabSwitches || 0,
      p_copy_paste_count: activityLog?.copyPasteCount || 0,
      p_exit_attempts: activityLog?.exitAttempts || 0
    })

    if (rpcError) {
      console.error("RPC Error:", rpcError)
      return NextResponse.json({ error: "Submission failed" }, { status: 500 })
    }

    if (!rpcResult.success) {
      return NextResponse.json({ error: rpcResult.error }, { status: 400 })
    }

    // 4. Save Graded Answers (After successful attempt update)
    const attemptId = rpcResult.attempt_id
    const answersToInsert = gradedAnswers.map(a => ({
      attempt_id: attemptId,
      ...a
    }))

    if (answersToInsert.length > 0) {
      await supabase.from("quiz_attempt_answers").insert(answersToInsert)
    }

    return NextResponse.json({
      success: true,
      score: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      needsGrading: hasEssayQuestions
    })

  } catch (error: any) {
    console.error("Submit quiz error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}