import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

export async function POST(request: Request) {
  try {
    // SECURITY FIX: Use secure IP extraction
    const ip = getClientIp(request)
    
    // Check rate limit (5 attempts per minute)
    const isAllowed = await checkRateLimit(ip, "login", 5, 60 * 1000)
    
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
      // Check if account is active
      const { data: userData } = await supabase
        .from("users")
        .select("is_active")
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
    }

    return NextResponse.json({ user: data.user })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}