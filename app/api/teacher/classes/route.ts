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

    if (userData?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 1. Fetch classes owned by teacher
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, grade, section, subject, schedule, room")
      .eq("teacher_id", user.id)
      .order("name")

    if (!classData) {
      return NextResponse.json({ classes: [] })
    }

    const classIds = classData.map(c => c.id)

    // 2. Fetch student counts
    let countMap: Record<string, number> = {}
    if (classIds.length > 0) {
      const { data: enrollments } = await supabase
        .from("class_students")
        .select("class_id")
        .in("class_id", classIds)

      enrollments?.forEach((e: any) => {
        countMap[e.class_id] = (countMap[e.class_id] || 0) + 1
      })
    }

    const classes = classData.map(c => ({
      ...c,
      student_count: countMap[c.id] || 0,
    }))

    return NextResponse.json({ classes })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}