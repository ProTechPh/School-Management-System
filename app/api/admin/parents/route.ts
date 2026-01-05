import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
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

    // Get all parents with their children
    const { data: parents, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        parent_children!parent_children_parent_id_fkey (
          relationship,
          student:users!parent_children_student_id_fkey (
            id,
            name
          )
        )
      `)
      .eq("role", "parent")
      .order("name")

    if (error) throw error

    // Transform the data
    const formattedParents = parents?.map(parent => ({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      children: parent.parent_children?.map((pc: any) => ({
        id: pc.student.id,
        name: pc.student.name,
        relationship: pc.relationship
      })) || []
    })) || []

    return NextResponse.json({ parents: formattedParents })
  } catch (error: any) {
    console.error("Error fetching parents:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch parents" },
      { status: 500 }
    )
  }
}
