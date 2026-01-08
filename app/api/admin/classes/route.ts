import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"
import { handleApiError, ApiErrors } from "@/lib/api-errors"

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Rate limiting to prevent scraping
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "admin-list-classes", 30, 60 * 1000)
    
    if (!isAllowed) {
      return ApiErrors.rateLimited()
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiErrors.unauthorized()
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return ApiErrors.forbidden()
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

    // Fetch student counts
    const { data: enrollments, error: enrollError } = await supabase
      .from("class_students")
      .select("class_id")

    if (enrollError) throw enrollError

    const countMap: Record<string, number> = {}
    enrollments?.forEach((e: any) => {
      countMap[e.class_id] = (countMap[e.class_id] || 0) + 1
    })

    // SECURITY FIX: DTO Pattern
    const safeClasses = classData.map((c: any) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      section: c.section,
      subject: c.subject,
      room: c.room,
      schedule: c.schedule,
      teacher_id: c.teacher_id,
      teacher_name: c.teacher?.name || null,
      student_count: countMap[c.id] || 0
    }))

    return NextResponse.json({ classes: safeClasses })
  } catch (error) {
    return handleApiError(error, "admin-list-classes")
  }
}