import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
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

    // Securely fetch teachers with profile data
    // Using two queries to simulate a join since profiles might be in a separate table
    // or a complex join if needed. Here we keep it efficient.
    
    const { data: teachers, error: teacherError } = await supabase
      .from("users")
      .select("id, name, email, avatar, phone, address")
      .eq("role", "teacher")
      .order("name")

    if (teacherError) throw teacherError

    // Fetch teacher profiles
    const { data: profiles, error: profileError } = await supabase
      .from("teacher_profiles")
      .select("id, subject, department, join_date")

    if (profileError) throw profileError

    // Merge data
    const profileMap = new Map(profiles.map(p => [p.id, p]))
    
    const enrichedTeachers = teachers.map(t => {
      const profile = profileMap.get(t.id)
      return {
        ...t,
        subject: profile?.subject || "N/A",
        department: profile?.department || null,
        join_date: profile?.join_date || null,
      }
    })

    return NextResponse.json({ teachers: enrichedTeachers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}