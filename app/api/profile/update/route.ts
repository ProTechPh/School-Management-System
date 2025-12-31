import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
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
    
    // 1. Update Base User Fields (Safe fields only)
    const allowedUserFields = ["name", "phone", "address", "avatar"]
    const userUpdates: Record<string, any> = {}

    for (const field of allowedUserFields) {
      if (body[field] !== undefined) {
        userUpdates[field] = body[field]
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
      // Explicitly excluding: grade, section, lrn, enrollment_status, scholarship info
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
      // Teachers can update their professional info usually, but we restrict if needed
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