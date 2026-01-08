import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAuditLogs, exportAuditLogsToCSV } from "@/lib/supabase/audit-logs"

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

    // Get user role - only admins can export
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
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Fetch all matching logs (no pagination for export)
    const result = await getAuditLogs({
      userId: userId || undefined,
      action: action || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      pageSize: 10000, // Large limit for export
    })

    // Convert to CSV
    const csv = exportAuditLogsToCSV(result.data)

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Audit Log Export API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
