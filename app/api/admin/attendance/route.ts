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

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: attendanceData, error } = await supabase
      .from("attendance_records")
      .select(`
        id, student_id, class_id, date, status,
        student:users!attendance_records_student_id_fkey (name),
        class:classes (name)
      `)
      .order("date", { ascending: false })

    if (error) throw error

    return NextResponse.json({ attendance: attendanceData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}