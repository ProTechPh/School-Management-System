import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { validateOrigin } from "@/lib/security"

export async function POST(request: Request) {
  // SECURITY FIX: CSRF Check
  if (!validateOrigin(request as any)) {
    return NextResponse.json({ error: "Invalid Origin" }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Verify Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 })
    }

    // 2. Perform Deletion
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Delete announcement error:", error.message)
      // SECURITY FIX: Generic error message
      return NextResponse.json({ error: "Failed to delete announcement." }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Delete announcement unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}