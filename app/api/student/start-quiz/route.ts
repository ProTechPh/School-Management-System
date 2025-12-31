import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

// Limit starting quizzes to 5 per minute to prevent spam
const startQuizLimiter = rateLimit(5, 60 * 1000)

export async function POST(request: Request) {
  try {
    // SECURITY FIX: Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!startQuizLimiter.check(ip)) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
    }

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
      // Create new attempt
      const { data: newAttempt, error } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quizId,
          student_id: user.id,
          score: 0,
          max_score: 0,
          percentage: 0,
          needs_grading: true,
        })
        .select("id")
        .single()

      if (error) throw error
      attemptId = newAttempt.id
    }

    // Security Fix 2: Use Service Role to fetch questions
    // This allows us to disable SELECT permissions on quiz_questions for the student role in RLS
    // to prevent students from querying the table directly in the browser console.
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: questions, error: qError } = await supabaseAdmin
      .from("quiz_questions")
      .select("id, question, type, options, points, sort_order")
      .eq("quiz_id", quizId)
      .order("sort_order")

    if (qError) throw qError

    // Sanitize questions (ensure no correct answers leaked, though select above already filters)
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