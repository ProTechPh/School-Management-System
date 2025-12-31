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

    // Fetch classes
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select(`
        id, name, grade, section, subject, room, schedule, teacher_id,
        teacher:users!classes_teacher_id_fkey (name)
      `)
      .order("name")

    if (classError) throw classError

    // Fetch student counts (can be optimized but keeping simple for now)
    const { data: enrollments, error: enrollError } = await supabase
      .from("class_students")
      .select("class_id")

    if (enrollError) throw enrollError

    const countMap: Record<string, number> = {}
    enrollments?.forEach((e: any) => {
      countMap[e.class_id] = (countMap[e.class_id] || 0) + 1
    })

    const classesWithCounts = classData.map((c: any) => ({
      ...c,
      student_count: countMap[c.id] || 0
    }))

    return NextResponse.json({ classes: classesWithCounts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}