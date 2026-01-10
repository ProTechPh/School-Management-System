import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Get meeting reports and analytics
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is teacher or admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!userData || !["teacher", "admin"].includes(userData.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const meetingId = searchParams.get("meetingId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  // If specific meeting requested, return detailed report
  if (meetingId) {
    const { data: meeting, error } = await supabase
      .from("zoom_meetings")
      .select(`
        *,
        host:users!zoom_meetings_host_id_fkey(id, name, email),
        class:classes(id, name),
        participants:zoom_participants(
          id, user_id, name, email, join_time, leave_time, duration, status,
          user:users(id, name, email, avatar, role)
        )
      `)
      .eq("id", meetingId)
      .single()

    if (error || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    // Calculate stats
    const participants = meeting.participants || []
    const joinedParticipants = participants.filter((p: { status: string }) => p.status === "joined" || p.status === "left")
    const totalDuration = joinedParticipants.reduce((sum: number, p: { duration?: number }) => sum + (p.duration || 0), 0)
    const avgDuration = joinedParticipants.length > 0 ? Math.round(totalDuration / joinedParticipants.length) : 0

    return NextResponse.json({
      meeting,
      stats: {
        totalInvited: participants.length,
        totalJoined: joinedParticipants.length,
        attendanceRate: participants.length > 0 
          ? Math.round((joinedParticipants.length / participants.length) * 100) 
          : 0,
        totalDurationSeconds: totalDuration,
        avgDurationSeconds: avgDuration,
      },
    })
  }

  // Otherwise return aggregate stats
  let query = supabase
    .from("zoom_meetings")
    .select(`
      id, title, start_time, duration, status,
      host:users!zoom_meetings_host_id_fkey(id, name),
      class:classes(id, name),
      participants:zoom_participants(id, status, duration)
    `)
    .order("start_time", { ascending: false })

  // Filter by host for teachers
  if (userData.role === "teacher") {
    query = query.eq("host_id", user.id)
  }

  if (startDate) {
    query = query.gte("start_time", startDate)
  }
  if (endDate) {
    query = query.lte("start_time", endDate)
  }

  const { data: meetings, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate aggregate stats
  const totalMeetings = meetings?.length || 0
  const completedMeetings = meetings?.filter(m => m.status === "ended").length || 0
  
  let totalParticipants = 0
  let totalAttendees = 0
  let totalMeetingMinutes = 0

  meetings?.forEach(meeting => {
    const participants = meeting.participants || []
    totalParticipants += participants.length
    totalAttendees += participants.filter((p: { status: string }) => p.status === "joined" || p.status === "left").length
    if (meeting.status === "ended") {
      totalMeetingMinutes += meeting.duration
    }
  })

  return NextResponse.json({
    meetings: meetings?.map(m => ({
      ...m,
      participantCount: m.participants?.length || 0,
      attendeeCount: m.participants?.filter((p: { status: string }) => p.status === "joined" || p.status === "left").length || 0,
    })),
    stats: {
      totalMeetings,
      completedMeetings,
      totalParticipants,
      totalAttendees,
      avgAttendanceRate: totalParticipants > 0 
        ? Math.round((totalAttendees / totalParticipants) * 100) 
        : 0,
      totalMeetingMinutes,
    },
  })
}
