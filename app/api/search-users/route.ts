import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const role = searchParams.get("role")

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Select ONLY safe public fields
    let dbQuery = supabase
      .from("users")
      .select("id, name, avatar, role")
      .neq("id", user.id) // Exclude self
      .ilike("name", `%${query}%`)
      .limit(10)

    // Optional role filter
    if (role) {
      dbQuery = dbQuery.eq("role", role)
    }

    const { data, error } = await dbQuery

    if (error) throw error

    return NextResponse.json({ users: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}