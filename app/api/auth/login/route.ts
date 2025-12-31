import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { loginRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Get IP address for rate limiting
    // In production, you might need to check 'x-forwarded-for' header
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    
    // Check rate limit
    if (!loginRateLimit.check(ip)) {
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

    return NextResponse.json({ user: data.user })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}