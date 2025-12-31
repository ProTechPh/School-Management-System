import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch grades with service role logic (implicit via RLS bypass or explicit check)
    // Here we rely on the authenticated admin user having proper RLS or just returning data securely
    const { data: gradeData, error } = await supabase
      .from("grades")
      .select(`
        id, student_id, class_id, score, max_score, percentage, grade, type, date,
        student:users!grades_student_id_fkey (name),
        class:classes (name, subject)
      `)
      .order("date", { ascending: false })

    if (error) throw error

    return NextResponse.json({ grades: gradeData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}