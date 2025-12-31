import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// Isolated function to check auth status using service role
// This ensures the service role client is only created and used within this scope
async function checkUserAuthStatus(userId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
  return !!data?.user && !error
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check if caller is authenticated as Admin using standard client
    const cookieStore = await cookies()
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {} // Read-only
        }
      }
    )
    
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check role from users table
    const { data: userData } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
      
    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ hasAuth: false })
    }

    // Only proceed to use service role logic after confirming admin status
    const hasAuth = await checkUserAuthStatus(userId)
    
    return NextResponse.json({ hasAuth })
  } catch {
    return NextResponse.json({ hasAuth: false })
  }
}