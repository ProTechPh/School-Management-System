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

    // 2. Fetch all student accounts (server-side only)
    const { data: studentUsers } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("role", "student")
      .order("name")
    
    if (!studentUsers) return NextResponse.json({ accounts: [] })

    // 3. Logic to filter unlinked accounts (can be refined based on specific business logic)
    // For now, we return the list so the frontend can exclude the *current* student ID
    // But since this is an Admin-only endpoint, exposing the list of students is acceptable context for the Admin.
    
    return NextResponse.json({ accounts: studentUsers })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}