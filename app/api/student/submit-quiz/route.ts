import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

export async function POST(request: Request) {
  try {
    // Rate Limiting with secure IP
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "submit-quiz", 3, 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { quizId, answers, activityLog } = body

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid submission data" }, { status: 400 })
    }

    // 1. Fetch Quiz Details
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(`
        id, duration, due_date, class_id,
        questions:quiz_questions (
          id, type, points, correct_answer, options
        )
      `)
      .eq("id", quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // 2. Fetch Existing Attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("id, created_at, completed_at")
      .eq("quiz_id", quizId)
      .eq("student_id", user.id)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: "Quiz attempt not started." }, { status: 400 })
    }

    if (attempt.completed_at) {
      return NextResponse.json({ error: "Quiz already submitted" }, { status: 400 })
    }

    // 3. Server-Side Time Verification (Trust Source)
    const startTime = new Date(attempt.created_at).getTime()
    const now = Date.now()
    const durationMs = now - startTime
    const durationMinutes = durationMs / 1000 / 60
    
    // Allow 2 minutes grace period for network latency
    const allowedDuration = quiz.duration + 2 

    if (durationMinutes > allowedDuration) {
      return NextResponse.json({ 
        error: "Time limit exceeded. Your submission was rejected." 
      }, { status: 403 })
    }

    // 4. Validate Due Date
    if (quiz.due_date) {
      const dueDate = new Date(quiz.due_date)
      if (now > dueDate.getTime() + 5 * 60 * 1000) { 
         const { data: reopen } = await supabase
          .from("quiz_reopens")
          .select("new_due_date")
          .eq("quiz_id", quizId)
          .eq("student_id", user.id)
          .single()

        if (!reopen || new Date(reopen.new_due_date).getTime() < now) {
           return NextResponse.json({ error: "Quiz submission is past due" }, { status: 403 })
        }
      }
    }

    // 5. Robust Server-Side Heuristics
    // Calculate "Impossible Speed"
    // Increased to 5000ms (5 seconds) per question as a more realistic minimum threshold.
    const minTimePerQuestionMs = 5000 
    const minTotalTimeMs = (quiz.questions.length * minTimePerQuestionMs)
    
    // If the quiz was completed faster than humanly possible, flag it.
    // This server-side check cannot be spoofed by the client.
    const isTooFast = durationMs < minTotalTimeMs

    // Sanitize Client Logs (Treat as ADVISORY only)
    const clientTabSwitches = typeof activityLog?.tabSwitches === 'number' ? Math.max(0, activityLog.tabSwitches) : 0
    const clientCopyPaste = typeof activityLog?.copyPasteCount === 'number' ? Math.max(0, activityLog.copyPasteCount) : 0
    const clientExitAttempts = typeof activityLog?.exitAttempts === 'number' ? Math.max(0, activityLog.exitAttempts) : 0

    // Combine Flags: Prioritize server-side detection
    // isFlagged will be true ONLY if speed is impossible. 
    // We ignore client metrics for automatic flagging to prevent bypass.
    const isFlagged = isTooFast

    // 6. Grade Answers
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
        attempt_id: attempt.id,
        question_id: question.id,
        answer: String(submission.answer),
        is_correct: isCorrect,
        points_awarded: pointsAwarded
      })
    }

    // 7. Save Graded Answers
    if (gradedAnswers.length > 0) {
      await supabase.from("quiz_attempt_answers").insert(gradedAnswers)
    }

    // 8. Update Attempt
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    
    await supabase
      .from("quiz_attempts")
      .update({
        score: totalScore,
        max_score: maxScore,
        percentage: percentage,
        needs_grading: hasEssayQuestions || isFlagged, // Auto-flag for review if suspicious
        completed_at: new Date().toISOString(),
        tab_switches: clientTabSwitches,
        copy_paste_count: clientCopyPaste,
        exit_attempts: clientExitAttempts
      })
      .eq("id", attempt.id)

    // Do not reveal flagging status to client to prevent probing
    return NextResponse.json({
      success: true,
      score: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      needsGrading: hasEssayQuestions // Only reveal normal grading status
    })

  } catch (error: any) {
    console.error("Submit quiz error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}