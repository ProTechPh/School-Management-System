import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch child's grades
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
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

  if (!userData || userData.role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Verify parent-child relationship
  const { data: relationship } = await supabase
    .from("parent_children")
    .select("id")
    .eq("parent_id", user.id)
    .eq("student_id", studentId)
    .single()

  if (!relationship) {
    return NextResponse.json({ error: "Not authorized to view this student's data" }, { status: 403 })
  }

  try {
    // Fetch grades with class and teacher info
    const { data: grades, error } = await supabase
      .from("grades")
      .select(`
        *,
        class:classes(id, name, subject),
        teacher:users!grades_teacher_id_fkey(id, name)
      `)
      .eq("student_id", studentId)
      .order("date", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ grades: grades || [] })
  } catch (error) {
    console.error("Error fetching grades:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
