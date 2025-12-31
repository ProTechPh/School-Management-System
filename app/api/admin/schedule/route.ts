import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Verify Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Fetch Schedule Data
    const { data } = await supabase
      .from("schedules")
      .select(`
        id, day, start_time, end_time, room,
        class:classes (
          name, subject,
          teacher:users!classes_teacher_id_fkey (name)
        )
      `)
      .order("day")
      .order("start_time")

    return NextResponse.json({ schedules: data || [] })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}