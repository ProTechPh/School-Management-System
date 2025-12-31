import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select(`
        id, title, description, duration, due_date, status, class_id,
        class:classes (name),
        teacher:users!quizzes_teacher_id_fkey (name),
        questions:quiz_questions (id)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ quizzes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}