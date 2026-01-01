import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Fetch user basic data
    const { data: studentUser, error: userError } = await supabase
      .from("users")
      .select("id, name, email, avatar, address")
      .eq("id", id)
      .single()

    if (userError || !studentUser) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Fetch profile data
    const { data: profileData } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("id", id)
      .single()

    // Check auth status (using admin API internally if needed, or re-using existing logic)
    // Since we are already admin, we can check auth.users if we had service role client,
    // but here we can just return the data we have. 
    // The frontend logic for 'hasAuthAccount' relied on a separate API call which is fine to keep separate or merge.
    // For simplicity, we return the profile data securely.

    return NextResponse.json({
      student: {
        ...studentUser,
        profile: profileData
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}