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

    const { parentId, studentId } = await request.json()

    if (!parentId || !studentId) {
      return NextResponse.json(
        { error: "Parent ID and Student ID are required" },
        { status: 400 }
      )
    }

    // Delete parent-child relationship
    const { error } = await supabase
      .from("parent_children")
      .delete()
      .eq("parent_id", parentId)
      .eq("student_id", studentId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error unlinking parent and child:", error)
    return NextResponse.json(
      { error: error.message || "Failed to unlink parent and child" },
      { status: 500 }
    )
  }
}
