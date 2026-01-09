import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { validateOrigin, getClientIp } from "@/lib/security"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  // CSRF Check
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid Origin" }, { status: 403 })
  }

  try {
    // Rate Limiting with secure IP
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "create-user", 10, 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
    }

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
    let { 
      email, password, name, role, lrn, 
      subject, department, phone, address 
    } = body

    // SECURITY FIX: Server-side password generation
    let generatedPassword = null
    if (!password) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
      const array = new Uint32Array(12)
      crypto.getRandomValues(array)
      password = ""
      for (let i = 0; i < 12; i++) {
        password += chars[array[i] % chars.length]
      }
      generatedPassword = password
    }

    // Enforce Strong Password Complexity
    const hasMinLength = password && password.length >= 12
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)

    if (!hasMinLength || !hasNumber || !hasSpecial || !hasUpperCase || !hasLowerCase) {
      return NextResponse.json({ 
        error: "Password must be at least 12 characters and contain uppercase, lowercase, number, and special character." 
      }, { status: 400 })
    }

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
      console.error("Auth creation error:", authError.message)
      return NextResponse.json({ error: "Unable to create user account. Please verify the details." }, { status: 400 })
    }

    if (authData.user) {
      // 4. Create public user record
      const { error: userError } = await supabaseAdmin.from("users").insert({
        id: authData.user.id,
        email,
        name,
        role,
        phone: phone || null,
        address: address || null,
        is_active: true,
        must_change_password: true,
      })

      if (userError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        console.error("DB User insert error:", userError.message)
        return NextResponse.json({ error: "Unable to create user account. Please verify the details." }, { status: 500 })
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
            subject: subject || "General",
            department: department || null,
            join_date: new Date().toISOString().split("T")[0],
          })
        }
      } catch (profileError) {
        console.error("Failed to create profile for user:", authData.user.id, profileError)
      }

      return NextResponse.json({ 
        success: true, 
        user: { id: authData.user.id, email, name, role, created_at: new Date().toISOString() },
        password: generatedPassword // Return the generated password to the admin
      })
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 })

  } catch (error: any) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}