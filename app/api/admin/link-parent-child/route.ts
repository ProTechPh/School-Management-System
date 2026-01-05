import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
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

    const { parentId, studentId, relationship } = await request.json()

    if (!parentId || !studentId) {
      return NextResponse.json(
        { error: "Parent ID and Student ID are required" },
        { status: 400 }
      )
    }

    // Insert parent-child relationship
    const { error } = await supabase
      .from("parent_children")
      .insert({
        parent_id: parentId,
        student_id: studentId,
        relationship: relationship || "guardian"
      })

    if (error) {
      if (error.code === "23505") { // Unique constraint violation
        return NextResponse.json(
          { error: "This parent-child relationship already exists" },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error linking parent and child:", error)
    return NextResponse.json(
      { error: error.message || "Failed to link parent and child" },
      { status: 500 }
    )
  }
}
