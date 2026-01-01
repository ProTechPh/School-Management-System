import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("class_students")
      .select(`
        class:classes (
          id, name, subject, schedule, room,
          teacher:users!classes_teacher_id_fkey (name, avatar)
        )
      `)
      .eq("student_id", user.id)

    if (enrollmentError) throw enrollmentError

    if (!enrollments) {
      return NextResponse.json({ classes: [] })
    }

    const classIds = enrollments.map((e: any) => e.class?.id).filter(Boolean)
    
    let countMap: Record<string, number> = {}
    
    if (classIds.length > 0) {
      const { data: allEnrollments, error: countError } = await supabase
        .from("class_students")
        .select("class_id")
        .in("class_id", classIds)

      if (countError) throw countError

      allEnrollments?.forEach((e: any) => {
        countMap[e.class_id] = (countMap[e.class_id] || 0) + 1
      })
    }

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
    console.error("GET Student Classes Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}