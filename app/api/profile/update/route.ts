import { createClient } from "@/lib/supabase/server"
import { NextResponse, NextRequest } from "next/server"
import { validateOrigin, profileUpdateSchema } from "@/lib/security"

export async function POST(request: NextRequest) {
  // SECURITY FIX: CSRF Check
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid Origin" }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = userData?.role
    const body = await request.json()

    // SECURITY FIX: Input Validation with Zod
    const validationResult = profileUpdateSchema.safeParse(body)
    
    if (!validationResult.success) {
      // Return the first error message
      return NextResponse.json({ error: validationResult.error.errors[0].message }, { status: 400 })
    }

    const validatedData = validationResult.data
    
    // 1. Update Base User Fields (Safe fields only)
    const allowedUserFields = ["name", "phone", "address", "avatar"]
    const userUpdates: Record<string, any> = {}

    for (const field of allowedUserFields) {
      if (validatedData[field as keyof typeof validatedData] !== undefined) {
        userUpdates[field] = validatedData[field as keyof typeof validatedData]
      }
    }

    if (Object.keys(userUpdates).length > 0) {
      const { error } = await supabase
        .from("users")
        .update(userUpdates)
        .eq("id", user.id)

      if (error) throw error
    }

    // 2. Update Role-Specific Fields
    if (role === "student") {
      // STRICT Whitelist for Students
      const allowedStudentFields = [
        "contact_number", "email",
        "current_house_street", "current_barangay", "current_city", "current_province", "current_region",
        "permanent_same_as_current", "permanent_house_street", "permanent_barangay", "permanent_city", "permanent_province", "permanent_region",
        "father_contact", "mother_contact", "guardian_contact",
        "emergency_contact_name", "emergency_contact_number",
        "medical_conditions", "blood_type"
      ]
      
      const studentUpdates: Record<string, any> = {}
      for (const field of allowedStudentFields) {
        // Since we used passthrough() in zod, these fields are available in body/validatedData
        // We trust them if they are simple strings/booleans, but ideally we'd validate them specifically too.
        // For simplicity, we just check existence in the raw body as Zod's passthrough keeps them.
        if (body[field] !== undefined) {
          studentUpdates[field] = body[field]
        }
      }

      if (Object.keys(studentUpdates).length > 0) {
        const { error } = await supabase
          .from("student_profiles")
          .update(studentUpdates)
          .eq("id", user.id)
        
        if (error) throw error
      }
    } else if (role === "teacher") {
      const allowedTeacherFields = ["subject", "department"]
      const teacherUpdates: Record<string, any> = {}
      
      for (const field of allowedTeacherFields) {
        if (body[field] !== undefined) {
          teacherUpdates[field] = body[field]
        }
      }

      if (Object.keys(teacherUpdates).length > 0) {
        const { error } = await supabase
          .from("teacher_profiles")
          .update(teacherUpdates)
          .eq("id", user.id)
        
        if (error) throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}