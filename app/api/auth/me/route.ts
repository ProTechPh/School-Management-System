import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Securely fetch only the authenticated user's data server-side
    // This allows us to disable public SELECT access on the 'users' table
    const { data: userData, error } = await supabase
      .from("users")
      .select("id, name, avatar, role")
      .eq("id", user.id)
      .single()

    if (error) throw error

    return NextResponse.json({ user: userData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}