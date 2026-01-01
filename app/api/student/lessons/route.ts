import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify role is student
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 1. Get student's enrolled classes
    const { data: enrollments } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", user.id)

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ lessons: [] })
    }

    const classIds = enrollments.map(e => e.class_id)

    // 2. Fetch lessons strictly for those classes
    const { data: lessons, error } = await supabase
      .from("lessons")
      .select(`
        id, title, description, content,
        class:classes (name),
        teacher:users!lessons_teacher_id_fkey (name),
        materials:lesson_materials (id, name, type, url, size)
      `)
      .in("class_id", classIds)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Transform data to match client expectations
    const safeLessons = lessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      content: l.content,
      class_name: l.class?.name || "Unknown",
      teacher_name: l.teacher?.name || null,
      materials: l.materials || [],
    }))

    return NextResponse.json({ lessons: safeLessons })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}