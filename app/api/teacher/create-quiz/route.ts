import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Explicit Role Check
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "teacher" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only teachers can create quizzes" }, { status: 403 })
    }

    const body = await request.json()
    const { title, classId, description, duration, dueDate, questions } = body

    if (!title || !classId || !questions || questions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify teacher owns the class (optional but recommended for strict access control)
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

    // Create quiz
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

    // Create questions
    const questionsToInsert = questions.map((q: any, index: number) => ({
      quiz_id: quizData.id,
      type: q.type,
      question: q.question,
      options: q.options || null,
      correct_answer: q.correctAnswer !== undefined ? String(q.correctAnswer) : null,
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}