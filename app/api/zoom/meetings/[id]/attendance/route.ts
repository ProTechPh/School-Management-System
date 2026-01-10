import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get attendance summary for a meeting
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get meeting with class info
  const { data: meeting } = await supabase
    .from("zoom_meetings")
    .select("id, class_id, start_time, status")
    .eq("id", id)
    .single()

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  if (!meeting.class_id) {
    return NextResponse.json({ 
      summary: null, 
      records: [],
      message: "This meeting is not linked to a class" 
    })
  }

  const meetingDate = new Date(meeting.start_time).toISOString().split("T")[0]

  // Get attendance records for this class on the meeting date
  const { data: records } = await supabase
    .from("attendance_records")
    .select(`
      student_id,
      status,
      student:users!attendance_records_student_id_fkey(id, name, email)
    `)
    .eq("class_id", meeting.class_id)
    .eq("date", meetingDate)

  // Get all enrolled students to calculate summary
  const { data: enrolledStudents } = await supabase
    .from("class_students")
    .select("student_id")
    .eq("class_id", meeting.class_id)

  const totalEnrolled = enrolledStudents?.length || 0
  
  // Calculate summary
  const summary = {
    total: totalEnrolled,
    present: records?.filter(r => r.status === "present").length || 0,
    absent: records?.filter(r => r.status === "absent").length || 0,
    partial: records?.filter(r => r.status === "partial").length || 0,
    late: records?.filter(r => r.status === "late").length || 0,
  }

  // If meeting hasn't ended yet, show current participants instead
  if (meeting.status !== "ended") {
    const { data: participants } = await supabase
      .from("zoom_participants")
      .select(`
        user_id,
        duration,
        status,
        user:users!zoom_participants_user_id_fkey(id, name, email, role)
      `)
      .eq("meeting_id", id)

    const studentParticipants = participants?.filter(p => 
      (p.user as { role?: string })?.role === "student"
    ) || []

    return NextResponse.json({
      summary: {
        total: totalEnrolled,
        present: studentParticipants.filter(p => p.status === "joined").length,
        absent: 0, // Can't determine until meeting ends
        partial: 0,
        late: 0,
      },
      records: [],
      message: "Meeting in progress - final attendance will be recorded when meeting ends",
      inProgress: true,
    })
  }

  return NextResponse.json({
    summary,
    records: records || [],
  })
}
