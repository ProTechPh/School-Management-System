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

    return NextResponse.json({ students: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}