import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch parent's children
export async function GET(request: NextRequest) {
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

  try {
    // Get parent-child relationships
    const { data: relationships, error: relError } = await supabase
      .from("parent_children")
      .select(`
        student_id,
        relationship,
        student:users!parent_children_student_id_fkey(
          id,
          name,
          email,
          avatar
        )
      `)
      .eq("parent_id", user.id)

    if (relError) {
      return NextResponse.json({ error: relError.message }, { status: 500 })
    }

    // Get student profiles for additional info
    const studentIds = relationships?.map((r: any) => r.student_id) || []
    
    if (studentIds.length === 0) {
      return NextResponse.json({ children: [] })
    }

    const { data: profiles } = await supabase
      .from("student_profiles")
      .select("user_id, grade_level, section")
      .in("user_id", studentIds)

    const children = relationships?.map((rel: any) => {
      const profile = profiles?.find((p) => p.user_id === rel.student_id)
      return {
        id: rel.student?.id,
        name: rel.student?.name,
        email: rel.student?.email,
        avatar: rel.student?.avatar,
        grade: profile?.grade_level,
        section: profile?.section,
        relationship: rel.relationship,
      }
    }) || []

    return NextResponse.json({ children })
  } catch (error) {
    console.error("Error fetching children:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
