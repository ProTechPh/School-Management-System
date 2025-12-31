import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  try {
    // 1. Strict Rate Limiting (5 requests per minute)
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const isAllowed = await checkRateLimit(ip, "search-users", 5, 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many search attempts. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const roleFilter = searchParams.get("role")

    // 2. Minimum Character Limit (Increased to 3)
    if (!query || query.length < 3) {
      return NextResponse.json({ users: [] })
    }

    // Get requester role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const requesterRole = userData?.role

    let dbQuery = supabase
      .from("users")
      .select("id, name, avatar, role")
      .neq("id", user.id)
      .ilike("name", `%${query}%`)
      .limit(10)

    // 3. Restrict Search Scope
    // Students can ONLY search for teachers. They cannot search for other students or admins.
    if (requesterRole === "student") {
      dbQuery = dbQuery.eq("role", "teacher")
    } 
    // Teachers can search students and other teachers
    else if (requesterRole === "teacher") {
      if (roleFilter === "student") {
        dbQuery = dbQuery.eq("role", "student")
      } else if (roleFilter === "teacher") {
        dbQuery = dbQuery.eq("role", "teacher")
      } else {
        // Default: can see students and teachers
        dbQuery = dbQuery.in("role", ["student", "teacher"])
      }
    }
    // Admins can search everyone (no restriction added)

    const { data, error } = await dbQuery

    if (error) throw error

    return NextResponse.json({ users: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}