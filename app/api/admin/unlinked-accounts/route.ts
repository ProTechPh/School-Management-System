import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Verify Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Fetch Unlinked Accounts Efficiently
    // We want students who do NOT have a corresponding entry in student_profiles
    // or teachers without teacher_profiles (depending on use case, this route seems general)
    
    // Fetch students without profiles
    // Note: Supabase/PostgREST doesn't support "NOT EXISTS" or left join filtering easily in one go via JS client
    // without rpc or raw sql. However, we can fetch users and profiles and diff them on server-side 
    // which is better than sending everything to client.
    
    // Better approach: Fetch IDs of profiles, then fetch users NOT IN that list.
    const { data: profiles } = await supabase
      .from("student_profiles")
      .select("id")
    
    const linkedIds = profiles?.map(p => p.id) || []

    let query = supabase
      .from("users")
      .select("id, email, name")
      .eq("role", "student")
    
    if (linkedIds.length > 0) {
      // Filter out users who already have profiles
      // Note: .not('id', 'in', linkedIds) might fail if list is too huge, 
      // but for typical school size it's fine.
      query = query.not('id', 'in', `(${linkedIds.join(',')})`)
    }
    
    const { data: unlinkedStudents } = await query
    
    return NextResponse.json({ accounts: unlinkedStudents || [] })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}