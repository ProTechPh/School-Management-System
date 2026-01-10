import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp, validateOrigin } from "@/lib/security"
import { createAnnouncementSchema } from "@/lib/validation-schemas"

export async function POST(request: NextRequest) {
  try {
    // SECURITY: CSRF Protection
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Invalid Origin" }, { status: 403 })
    }

    // 1. Rate Limiting
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "create-announcement", 5, 60 * 1000) // 5 per minute
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = userData?.role

    if (role !== "admin" && role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    
    // SECURITY: Validate input with Zod schema
    const validationResult = createAnnouncementSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: validationResult.error.errors[0]?.message || "Invalid input" 
      }, { status: 400 })
    }

    const { title, content, targetAudience, priority } = validationResult.data

    // Enforce Role-Based Logic
    // Teachers can only post to "students" (or specific student groups if implemented later)
    // Admins can post to anyone
    if (role === "teacher" && targetAudience !== "students") {
       return NextResponse.json({ error: "Teachers can only post announcements for students." }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title,
        content,
        author_id: user.id,
        target_audience: targetAudience,
        priority: priority || "normal",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, announcement: data })

  } catch (error: any) {
    console.error("Create announcement error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}