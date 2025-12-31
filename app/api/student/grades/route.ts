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

    // Server-side enforcement: Only fetch grades for the authenticated user
    const { data: grades, error } = await supabase
      .from("grades")
      .select(`
        id, class_id, type, score, max_score, percentage, grade, date,
        class:classes (name)
      `)
      .eq("student_id", user.id) // Strict filter
      .order("date", { ascending: false })

    if (error) throw error

    return NextResponse.json({ grades })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}