import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"
import { handleApiError, ApiErrors, validatePagination, sanitizeSearchInput } from "@/lib/api-errors"

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Rate limiting to prevent scraping
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "admin-list-students", 30, 60 * 1000)
    
    if (!isAllowed) {
      return ApiErrors.rateLimited()
    }

    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error("[admin-list-students] Auth error:", authError)
      return ApiErrors.unauthorized()
    }
    
    if (!user) {
      return ApiErrors.unauthorized()
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("[admin-list-students] User lookup error:", userError)
      return NextResponse.json(
        { error: "Failed to verify user permissions" },
        { status: 500 }
      )
    }

    if (userData?.role !== "admin") {
      return ApiErrors.forbidden()
    }

    // OPTIMIZATION: Add pagination support with validation
    const { searchParams } = new URL(request.url)
    
    // Validate pagination parameters
    let pagination
    try {
      pagination = validatePagination(
        searchParams.get('page'),
        searchParams.get('pageSize')
      )
    } catch (validationError) {
      return ApiErrors.validationError(
        validationError instanceof Error ? validationError.message : 'Invalid parameters'
      )
    }
    
    const { page, pageSize, from, to } = pagination
    const search = sanitizeSearchInput(searchParams.get('search'))

    // Build query with pagination
    let query = supabase
      .from("users")
      .select("id, name, email, student_profiles(grade, section, lrn)", { count: 'exact' })
      .eq("role", "student")
      .order("name")
      .range(from, to)

    // Add search filter if provided (already sanitized)
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: students, error, count } = await query

    if (error) {
      console.error("[admin-list-students] Query error:", error)
      return NextResponse.json(
        { 
          error: "Failed to fetch students",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }

    // Ensure data integrity
    const safeStudents = (students || []).map(student => ({
      id: student.id,
      name: student.name || 'Unknown',
      email: student.email || '',
      student_profiles: student.student_profiles || null
    }))

    return NextResponse.json({ 
      students: safeStudents,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasMore: (count || 0) > to + 1
      }
    })
  } catch (error) {
    console.error("[admin-list-students] Unexpected error:", error)
    return handleApiError(error, "admin-list-students")
  }
}
