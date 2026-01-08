import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { handleApiError, ApiErrors } from "@/lib/api-errors"

/**
 * 输入验证 Schema
 * Input validation schema for user status toggle
 */
const toggleStatusSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  status: z.boolean(),
})

export async function POST(request: Request) {
  try {
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

    // SECURITY FIX: Validate input with Zod schema
    const body = await request.json()
    const validationResult = toggleStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return ApiErrors.badRequest("Invalid parameters")
    }

    const { userId, status } = validationResult.data

    // SECURITY: Prevent admin from disabling their own account
    if (userId === user.id) {
      return ApiErrors.badRequest("Cannot modify your own account status")
    }

    // Perform update
    const { error } = await supabase
      .from("users")
      .update({ is_active: status })
      .eq("id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "toggle-user-status")
  }
}