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

    // Securely fetch only the requesting student's records
    const { data: records, error } = await supabase
      .from("attendance_records")
      .select(`
        id, date, status,
        class:classes (name)
      `)
      .eq("student_id", user.id)
      .order("date", { ascending: false })

    if (error) throw error

    return NextResponse.json({ records })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}