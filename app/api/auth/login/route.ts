import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
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
        return NextResponse.json(
          { error: "Your account has been disabled. Please contact the administrator." }, 
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ user: data.user })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}