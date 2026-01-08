import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"
import { handleApiError, ApiErrors } from "@/lib/api-errors"

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

    // Get all students
    const { data: students, error } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("role", "student")
      .order("name")

    if (error) throw error

    return NextResponse.json({ students: students || [] })
  } catch (error) {
    return handleApiError(error, "admin-list-students")
  }
}
