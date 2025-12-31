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
    const { quizId, answers, activityLog } = body

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid submission data" }, { status: 400 })
    }

    // 1. Fetch Quiz and Questions (including correct answers)
    // We use the server client which has access to the data, but we process it here
    // and only return the score, not the answer key.
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(`
        id, duration, due_date,
        questions:quiz_questions (
          id, type, points, correct_answer, options
        )
      `)
      .eq("id", quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // 2. Validate Due Date (Server-side check)
    if (quiz.due_date) {
      const dueDate = new Date(quiz.due_date)
      // Add a small buffer (e.g., 5 minutes) for network latency/clock skew
      const now = new Date()
      if (now.getTime() > dueDate.getTime() + 5 * 60 * 1000) {
        // Check if student has a specific reopen extension
        const { data: reopen } = await supabase
          .from("quiz_reopens")
          .select("new_due_date")
          .eq("quiz_id", quizId)
          .eq("student_id", user.id)
          .single()

        if (!reopen || new Date(reopen.new_due_date).getTime() < now.getTime()) {
           return NextResponse.json({ error: "Quiz submission is past due" }, { status: 403 })
        }
      }
    }

    // 3. Create Attempt Record
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: quizId,
        student_id: user.id,
        score: 0, // Calculated below
        max_score: 0, // Calculated below
        percentage: 0,
        needs_grading: true, // Default to true, check below
        completed_at: new Date().toISOString(),
        tab_switches: activityLog?.tabSwitches || 0,
        copy_paste_count: activityLog?.copyPasteCount || 0,
        exit_attempts: activityLog?.exitAttempts || 0
      })
      .select()
      .single()

    if (attemptError) {
      return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 })
    }

    // 4. Grade Answers
    let totalScore = 0
    let maxScore = 0
    let hasUngradedItems = false
    const gradedAnswers = []

    const questionMap = new Map(quiz.questions.map((q: any) => [q.id, q]))

    for (const submission of answers) {
      const question = questionMap.get(submission.questionId)
      if (!question) continue

      let isCorrect = false
      let pointsAwarded = 0
      
      maxScore += question.points

      // Auto-grading logic
      if (question.type === "multiple-choice" || question.type === "true-false") {
        // For these types, correct_answer is usually an index stored as string
        if (String(submission.answer) === String(question.correct_answer)) {
          isCorrect = true
          pointsAwarded = question.points
        }
      } else if (question.type === "identification") {
        // Case insensitive check if configured (assuming question data might have case_sensitive flag, 
        // defaulting to insensitive for simplicity here unless strictly specified)
        const studentAns = String(submission.answer).trim().toLowerCase()
        const correctAns = String(question.correct_answer).trim().toLowerCase()
        if (studentAns === correctAns) {
          isCorrect = true
          pointsAwarded = question.points
        }
      } else if (question.type === "essay") {
        hasUngradedItems = true
        // Essays are always false/0 until graded by teacher
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

    // 5. Save Graded Answers
    if (gradedAnswers.length > 0) {
      const { error: ansError } = await supabase
        .from("quiz_attempt_answers")
        .insert(gradedAnswers)
      
      if (ansError) {
        // Log error but don't fail the whole request if possible, 
        // though typically we'd want transaction consistency.
        console.error("Error saving answers:", ansError)
      }
    }

    // 6. Update Attempt with Final Score
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    
    await supabase
      .from("quiz_attempts")
      .update({
        score: totalScore,
        max_score: maxScore,
        percentage: percentage,
        needs_grading: hasUngradedItems
      })
      .eq("id", attempt.id)

    return NextResponse.json({
      success: true,
      score: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      needsGrading: hasUngradedItems
    })

  } catch (error: any) {
    console.error("Submit quiz error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}