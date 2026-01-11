import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

// Strict validation schema for Quiz creation
const questionSchema = z.object({
  type: z.enum(["multiple-choice", "true-false", "identification", "essay"]),
  question: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).optional().nullable(),
  correctAnswer: z.union([z.string(), z.number()]).optional().nullable(),
  points: z.number().min(1).max(100),
  caseSensitive: z.boolean().optional(),
})

const quizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  classId: z.string().uuid("Invalid Class ID"),
  description: z.string().optional(),
  duration: z.number().min(1).max(180), // Max 3 hours
  dueDate: z.string().optional().nullable(), // Date string validation could be stricter
  questions: z.array(questionSchema).min(1, "At least one question is required").max(50, "Max 50 questions allowed"),
})

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "create-quiz", 5, 60 * 1000) // 5 quizzes per minute
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Explicit Role Check
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "teacher" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only teachers can create quizzes" }, { status: 403 })
    }

    const body = await request.json()

    // 3. Zod Input Validation
    const validation = quizSchema.safeParse(body)
    
    if (!validation.success) {
      const errorMessage = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { title, classId, description, duration, dueDate, questions } = validation.data

    // 4. Verify teacher owns the class
    if (userData.role === "teacher") {
      const { data: classData } = await supabase
        .from("classes")
        .select("teacher_id")
        .eq("id", classId)
        .single()
      
      if (classData?.teacher_id !== user.id) {
        return NextResponse.json({ error: "You can only create quizzes for your own classes" }, { status: 403 })
      }
    }

    // 5. Create quiz
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title,
        class_id: classId,
        teacher_id: user.id,
        description: description || null,
        duration,
        due_date: dueDate || null,
        status: "published",
      })
      .select()
      .single()

    if (quizError) {
      throw quizError
    }

    // 6. Create questions
    const questionsToInsert = questions.map((q, index) => ({
      quiz_id: quizData.id,
      type: q.type,
      question: q.question,
      options: q.options || null,
      correct_answer: q.correctAnswer !== undefined && q.correctAnswer !== null ? String(q.correctAnswer) : null,
      points: q.points,
      case_sensitive: q.caseSensitive || false,
      sort_order: index,
    }))

    const { error: questionsError } = await supabase.from("quiz_questions").insert(questionsToInsert)
    
    if (questionsError) {
      // Rollback quiz if questions fail
      await supabase.from("quizzes").delete().eq("id", quizData.id)
      throw questionsError
    }

    return NextResponse.json({ success: true, quizId: quizData.id })

  } catch (error: any) {
    console.error("Create quiz error:", error)
    return NextResponse.json({ error: "Failed to create quiz." }, { status: 500 })
  }
}