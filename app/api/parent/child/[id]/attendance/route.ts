import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateAttendanceStats } from "@/lib/attendance-utils"

// GET - Fetch child's attendance records
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!userData || userData.role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Verify parent-child relationship
  const { data: relationship } = await supabase
    .from("parent_children")
    .select("id")
    .eq("parent_id", user.id)
    .eq("student_id", studentId)
    .single()

  if (!relationship) {
    return NextResponse.json({ error: "Not authorized to view this student's data" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let query = supabase
      .from("attendance_records")
      .select(`
        *,
        class:classes(id, name, subject)
      `)
      .eq("student_id", studentId)
      .order("date", { ascending: false })

    if (startDate) {
      query = query.gte("date", startDate)
    }
    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data: attendance, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate statistics
    const stats = calculateAttendanceStats(attendance || [])

    return NextResponse.json({ 
      attendance: attendance || [], 
      stats 
    })
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
