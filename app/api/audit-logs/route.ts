import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAuditLogs, detectSuspiciousActivity } from "@/lib/supabase/audit-logs"

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

    // Get user role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const ipAddress = searchParams.get("ipAddress")
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")
    const detectSuspicious = searchParams.get("detectSuspicious") === "true"

    // Authorization: Only admins can see all logs, users can only see their own
    if (userData?.role !== "admin" && userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If detecting suspicious activity
    if (detectSuspicious) {
      const alerts = await detectSuspiciousActivity(
        userData?.role === "admin" ? undefined : user.id
      )
      return NextResponse.json({ alerts })
    }

    // Fetch audit logs
    const result = await getAuditLogs({
      userId: userId || undefined,
      action: action || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      ipAddress: ipAddress || undefined,
      page,
      pageSize,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Audit Logs API Error:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs." }, { status: 500 })
  }
}
