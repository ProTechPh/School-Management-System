import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Fetch Enrolled Classes with Teacher Data
    // Note: We strictly select only name and avatar for the teacher to prevent PII leak
    const { data: enrollments } = await supabase
      .from("class_students")
      .select(`
        class:classes (
          id, name, subject, schedule, room,
          teacher:users!classes_teacher_id_fkey (name, avatar)
        )
      `)
      .eq("student_id", user.id)

    if (!enrollments) {
      return NextResponse.json({ classes: [] })
    }

    const classIds = enrollments.map((e: any) => e.class?.id).filter(Boolean)
    
    // 2. Get student counts for these classes
    let countMap: Record<string, number> = {}
    
    if (classIds.length > 0) {
      const { data: allEnrollments } = await supabase
        .from("class_students")
        .select("class_id")
        .in("class_id", classIds)

      allEnrollments?.forEach((e: any) => {
        countMap[e.class_id] = (countMap[e.class_id] || 0) + 1
      })
    }

    // 3. Format Response (DTO)
    const classes = enrollments.map((e: any) => {
      const c = e.class
      return {
        id: c.id,
        name: c.name,
        subject: c.subject,
        schedule: c.schedule,
        room: c.room,
        teacher_name: c.teacher?.name || null,
        teacher_avatar: c.teacher?.avatar || null,
        student_count: countMap[c.id] || 0,
      }
    })

    return NextResponse.json({ classes })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}