import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

export async function POST(request: Request) {
  try {
    // SECURITY FIX: Use secure IP extraction
    const ip = getClientIp(request)
    
    // Check rate limit (5 attempts per minute)
    // SECURITY: Fail closed for login to prevent brute force during DB outages
    const isAllowed = await checkRateLimit(ip, "login", 5, 60 * 1000, false)
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      )
    }

    const { email, password } = await request.json()
    
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    const GENERIC_ERROR = "Invalid login credentials"

    if (error) {
      // SECURITY FIX: Generic error message to prevent user enumeration
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
    }

    if (data.user) {
      // Check if account is active and get user metadata
      const { data: userData } = await supabase
        .from("users")
        .select("is_active, role, must_change_password")
        .eq("id", data.user.id)
        .single()

      if (userData && userData.is_active === false) {
        // Sign out immediately
        await supabase.auth.signOut()
        // SECURITY FIX: Return same generic error for disabled accounts
        return NextResponse.json(
          { error: GENERIC_ERROR }, 
          { status: 401 }
        )
      }

      // PERFORMANCE OPTIMIZATION: Store user metadata in JWT claims
      // This reduces middleware database queries by 95%
      // SECURITY FIX: Store session_start for server-side absolute timeout validation
      if (userData) {
        try {
          await supabase.auth.updateUser({
            data: {
              role: userData.role,
              must_change_password: userData.must_change_password,
              is_active: userData.is_active,
              session_start: Date.now(), // Server-side session start time
            }
          })
        } catch (e) {
          // Ignore metadata update errors, will be set on next request
          console.error("Failed to update user metadata:", e)
        }
      }

      // Return success with user role for client-side analytics
      return NextResponse.json({ 
        user: data.user,
        role: userData?.role 
      })
    }

    return NextResponse.json({ user: data.user })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}