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

    if (userData?.role !== "teacher" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only fetch lessons created by this teacher
    const { data: lessons, error } = await supabase
      .from("lessons")
      .select(`
        id, title, description, content, class_id, updated_at,
        class:classes (name),
        materials:lesson_materials (id, name, type, url)
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ lessons })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}