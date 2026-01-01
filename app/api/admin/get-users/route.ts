import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin role server-side
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Pagination logic
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Perform the fetch with verified privileges and pagination
    const { data, error, count } = await supabase
      .from("users")
      .select("id, email, name, role, created_at, is_active", { count: 'exact' })
      .order("name")
      .range(from, to)

    if (error) throw error

    // Explicit DTO mapping
    const safeUsers = data.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      created_at: u.created_at,
      is_active: u.is_active
    }))

    return NextResponse.json({ 
      users: safeUsers,
      total: count,
      page,
      limit
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}