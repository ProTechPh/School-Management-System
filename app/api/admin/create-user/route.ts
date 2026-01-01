import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { validateOrigin } from "@/lib/security"

export async function POST(request: NextRequest) {
  // SECURITY FIX: CSRF Check
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid Origin" }, { status: 403 })
  }

  try {
    // 1. Verify the caller is an admin
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {} 
        }
      }
    )
    
    const { data: { user: caller } } = await supabaseAuth.auth.getUser()
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: callerData } = await supabaseAuth
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .single()

    if (callerData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Parse body
    const body = await request.json()
    const { email, password, name, role, lrn } = body

    // 3. Create user using Service Role (Admin) client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      // 4. Create public user record
      const { error: userError } = await supabaseAdmin.from("users").insert({
        id: authData.user.id,
        email,
        name,
        role,
        is_active: true,
        must_change_password: true,
      })

      if (userError) {
        // Rollback auth user if DB insert fails
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        
        if (deleteError) {
          // CRITICAL: Log orphaned user if rollback fails
          console.error(`CRITICAL: Orphaned Auth User Created! ID: ${authData.user.id}, Email: ${email}. Reason: DB insert failed and rollback failed. Manual cleanup required.`)
        }
        
        return NextResponse.json({ error: userError.message }, { status: 400 })
      }

      // 5. Create role-specific profile
      try {
        if (role === "student" && lrn) {
          await supabaseAdmin.from("student_profiles").insert({
            id: authData.user.id,
            lrn: lrn,
            first_name: name.split(" ")[0],
            last_name: name.split(" ").slice(-1)[0],
            grade: "10",
            section: "A",
          })
        } else if (role === "teacher") {
          await supabaseAdmin.from("teacher_profiles").insert({
            id: authData.user.id,
            subject: "General",
          })
        }
      } catch (profileError) {
        // Log profile creation error but don't fail the whole request since base user exists
        console.error("Failed to create profile for user:", authData.user.id, profileError)
      }

      return NextResponse.json({ 
        success: true, 
        user: { id: authData.user.id, email, name, role, created_at: new Date().toISOString() } 
      })
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}