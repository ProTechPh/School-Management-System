import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student's grade
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("grade")
      .eq("id", user.id)
      .single()

    const grade = profile?.grade || ""

    // Fetch announcements strictly filtered for this student
    // This logic runs on the server, so the client cannot bypass it
    const { data: announcements, error } = await supabase
      .from("announcements")
      .select(`
        id, title, content, target_audience, priority, created_at,
        author:users!announcements_author_id_fkey (name)
      `)
      .or(`target_audience.eq.all,target_audience.eq.students,target_audience.eq.grade-${grade}`)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ announcements })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}