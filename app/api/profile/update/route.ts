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

    // Use validated data which strips unknown fields
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
      // SECURITY FIX: Removed 'email' to prevent unverified updates
      const allowedStudentFields = [
        "contact_number",
        "current_house_street", "current_barangay", "current_city", "current_province", "current_region",
        "permanent_same_as_current", "permanent_house_street", "permanent_barangay", "permanent_city", "permanent_province", "permanent_region",
        "father_contact", "mother_contact", "guardian_contact",
        "emergency_contact_name", "emergency_contact_number",
        "medical_conditions", "blood_type"
      ]
      
      const studentUpdates: Record<string, any> = {}
      for (const field of allowedStudentFields) {
        // Use validatedData to ensure length limits are respected
        const val = validatedData[field as keyof typeof validatedData]
        if (val !== undefined) {
          studentUpdates[field] = val
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
        const val = validatedData[field as keyof typeof validatedData]
        if (val !== undefined) {
          teacherUpdates[field] = val
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