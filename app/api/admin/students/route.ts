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

    // Securely fetch students with profile data
    const { data, error } = await supabase
      .from("users")
      .select(`
        id, name, email, avatar, address,
        student_profiles (grade, section, lrn, father_name, father_contact, mother_name, mother_contact, guardian_name, guardian_contact, enrollment_date)
      `)
      .eq("role", "student")
      .order("name")

    if (error) throw error

    // SECURITY FIX: DTO Pattern
    // Explicitly map database fields to response object to avoid accidental leaks of new schema columns
    const safeStudents = data.map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      address: s.address,
      // Map profile fields safely
      student_profiles: s.student_profiles ? s.student_profiles.map((p: any) => ({
        grade: p.grade,
        section: p.section,
        lrn: p.lrn,
        father_name: p.father_name,
        father_contact: p.father_contact,
        mother_name: p.mother_name,
        mother_contact: p.mother_contact,
        guardian_name: p.guardian_name,
        guardian_contact: p.guardian_contact,
        enrollment_date: p.enrollment_date
      })) : []
    }))

    return NextResponse.json({ students: safeStudents })
  } catch (error: any) {
    console.error("Fetch students error:", error)
    return NextResponse.json({ error: "Failed to fetch student records." }, { status: 500 })
  }
}