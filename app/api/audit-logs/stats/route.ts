import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAuditLogStats } from "@/lib/supabase/audit-logs"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role - only admins can see stats
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")

    // Fetch stats
    const stats = await getAuditLogStats(days)

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("Audit Log Stats API Error:", error)
    return NextResponse.json({ error: "Failed to fetch audit statistics." }, { status: 500 })
  }
}
