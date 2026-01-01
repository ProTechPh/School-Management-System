import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { targetUserId, profileData, role } = await request.json()

    if (!targetUserId || !profileData || !role) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Perform DB Updates
    // 1. Update User Record
    const nameParts = [
      profileData.first_name,
      profileData.middle_name,
      profileData.last_name,
      profileData.name_extension
    ].filter(Boolean).join(" ")

    // Only construct name if student, otherwise use provided name for teachers if applicable
    const userName = role === "student" ? nameParts : profileData.name

    const userUpdate: any = { name: userName }
    if (profileData.phone) userUpdate.phone = profileData.phone
    if (profileData.address) userUpdate.address = profileData.address
    // For students, construct address from components if provided
    if (role === "student" && profileData.current_house_street) {
       userUpdate.address = `${profileData.current_house_street}, ${profileData.current_barangay || ''}, ${profileData.current_city || ''}`
    }

    await supabase
      .from("users")
      .update(userUpdate)
      .eq("id", targetUserId)

    // 2. Update/Insert Profile
    if (role === "student") {
      const { id: _ignore, ...safeProfileData } = profileData
      const { error: profileError } = await supabase
        .from("student_profiles")
        .upsert({
          id: targetUserId,
          ...safeProfileData
        })
      
      if (profileError) throw profileError

    } else if (role === "teacher") {
      const { error: profileError } = await supabase
        .from("teacher_profiles")
        .upsert({
          id: targetUserId,
          subject: profileData.subject,
          department: profileData.department,
          join_date: profileData.join_date
        })
      
      if (profileError) throw profileError
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}