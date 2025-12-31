import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

// Create a limiter for quiz submissions (e.g., 3 attempts per minute per IP to prevent spam)
const submitLimiter = rateLimit(3, 60 * 1000)

export async function POST(request: Request) {
  try {
    // SECURITY FIX: Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!submitLimiter.check(ip)) {
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

    // SECURITY FIX: Idempotency check to prevent double grading
    if (attempt.completed_at) {
      return NextResponse.json({ error: "Quiz already submitted" }, { status: 400 })
    }

    // 3. Server-Side Time Verification
    // We strictly use the server-stored start time vs current server time.
    // Client-side timers are for display only and are untrusted.
    const startTime = new Date(attempt.created_at).getTime()
    const now = Date.now()
    const durationMinutes = (now - startTime) / 1000 / 60
    const durationMs = now - startTime
    
    // Allow a small buffer (2 minutes) for network latency
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

    // SECURITY FIX: Server-Side Heuristics
    // Check for impossible completion speeds (e.g., < 2 seconds per question)
    const minTimePerQuestionMs = 2000 // 2 seconds
    const minTotalTimeMs = quiz.questions.length * minTimePerQuestionMs
    
    // Flag if completion time is suspiciously fast
    // This is a hard metric calculated on the server that cannot be bypassed by client manipulation
    const isTooFast = durationMs < minTotalTimeMs

    // 5. Grade Answers
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

    // 6. Save Graded Answers
    if (gradedAnswers.length > 0) {
      await supabase.from("quiz_attempt_answers").insert(gradedAnswers)
    }

    // 7. Update Attempt
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    
    // SECURITY FIX: Treat client logs as weak signals.
    // We store them for reference, but the server-side `isTooFast` metric is the primary
    // trusted signal for flagging.
    const clientTabSwitches = typeof activityLog?.tabSwitches === 'number' ? activityLog.tabSwitches : 0
    const clientCopyPaste = typeof activityLog?.copyPasteCount === 'number' ? activityLog.copyPasteCount : 0
    const clientExitAttempts = typeof activityLog?.exitAttempts === 'number' ? activityLog.exitAttempts : 0

    // Flag logic: If server detects speed anomaly OR client reports high activity
    const isFlagged = isTooFast || 
                      clientTabSwitches > 10 || 
                      clientCopyPaste > 5

    await supabase
      .from("quiz_attempts")
      .update({
        score: totalScore,
        max_score: maxScore,
        percentage: percentage,
        needs_grading: hasEssayQuestions || isFlagged,
        completed_at: new Date().toISOString(),
        tab_switches: clientTabSwitches,
        copy_paste_count: clientCopyPaste,
        exit_attempts: clientExitAttempts
      })
      .eq("id", attempt.id)

    return NextResponse.json({
      success: true,
      score: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      needsGrading: hasEssayQuestions || isFlagged,
      flagged: isFlagged
    })

  } catch (error: any) {
    console.error("Submit quiz error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}