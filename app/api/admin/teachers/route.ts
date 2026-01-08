import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"
import { handleApiError, ApiErrors } from "@/lib/api-errors"

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Rate limiting to prevent scraping
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "admin-list-teachers", 30, 60 * 1000)
    
    if (!isAllowed) {
      return ApiErrors.rateLimited()
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiErrors.unauthorized()
    }

    // Verify Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return ApiErrors.forbidden()
    }

    // Securely fetch teachers
    // Note: Even if RLS restricts columns, Admins (service role or privileged) can see more.
    // We explicitly select fields here to be safe.
    const { data: teachers, error: teacherError } = await supabase
      .from("users")
      .select("id, name, email, avatar, phone, address")
      .eq("role", "teacher")
      .order("name")

    if (teacherError) throw teacherError

    const { data: profiles, error: profileError } = await supabase
      .from("teacher_profiles")
      .select("id, subject, department, join_date")

    if (profileError) throw profileError

    // Strict DTO Mapping
    const profileMap = new Map(profiles.map(p => [p.id, p]))
    
    const enrichedTeachers = teachers.map(t => {
      const profile = profileMap.get(t.id)
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        avatar: t.avatar,
        // Only include sensitive fields if the requester is verified Admin
        phone: t.phone, 
        address: t.address,
        subject: profile?.subject || "N/A",
        department: profile?.department || null,
        join_date: profile?.join_date || null,
      }
    })

    return NextResponse.json({ teachers: enrichedTeachers })
  } catch (error) {
    return handleApiError(error, "admin-list-teachers")
  }
}