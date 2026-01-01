import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { percentageToPhGrade } from "@/lib/grade-utils"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify Teacher Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: classId } = await params

    // Verify Ownership: Teacher MUST own the class
    const { data: classData } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", classId)
      .single()

    if (!classData || classData.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this class" }, { status: 403 })
    }

    // Fetch Students enrolled in the class
    const { data: students } = await supabase
      .from("class_students")
      .select(`
        student:users!class_students_student_id_fkey (id, name, email, avatar)
      `)
      .eq("class_id", classId)

    const studentList = students?.map((s: any) => s.student) || []

    // Fetch Grades
    const { data: grades } = await supabase
      .from("grades")
      .select("*")
      .eq("class_id", classId)

    // Fetch Quiz Attempts
    const { data: quizAttempts } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        quiz:quizzes!inner (class_id)
      `)
      .eq("quiz.class_id", classId)

    // Merge grades and attempts
    const allGrades = [...(grades || [])]

    if (quizAttempts) {
      quizAttempts.forEach((attempt: any) => {
        // Avoid duplicates if synced
        const exists = allGrades.some(g => 
          g.type === "quiz" && 
          g.student_id === attempt.student_id && 
          g.date === attempt.completed_at
        )
        if (!exists) {
          allGrades.push({
            id: `quiz-${attempt.id}`,
            student_id: attempt.student_id,
            class_id: classId,
            score: attempt.score,
            max_score: attempt.max_score,
            percentage: attempt.percentage,
            grade: percentageToPhGrade(attempt.percentage),
            type: "quiz",
            date: attempt.completed_at,
          })
        }
      })
    }

    return NextResponse.json({ 
      students: studentList,
      grades: allGrades
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}