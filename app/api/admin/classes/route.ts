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

    // OPTIMIZATION: Add pagination support
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // OPTIMIZATION: Use aggregation to get student counts in single query
    let query = supabase
      .from("classes")
      .select(`
        id, name, grade, section, subject, room, schedule, teacher_id,
        teacher:users!classes_teacher_id_fkey (name),
        enrollments:class_students(count)
      `, { count: 'exact' })
      .order("name")
      .range(from, to)

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%`)
    }

    const { data: classData, error: classError, count } = await query

    if (classError) throw classError

    // SECURITY FIX: DTO Pattern - transform data
    const safeClasses = classData?.map((c: any) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      section: c.section,
      subject: c.subject,
      room: c.room,
      schedule: c.schedule,
      teacher_id: c.teacher_id,
      teacher_name: c.teacher?.name || null,
      student_count: c.enrollments?.[0]?.count || 0
    })) || []

    return NextResponse.json({ 
      classes: safeClasses,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })
  } catch (error) {
    return handleApiError(error, "admin-list-classes")
  }
}