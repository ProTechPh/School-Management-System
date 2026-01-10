import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get meeting participants with detailed info
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get meeting with participants
  const { data: meeting, error: meetingError } = await supabase
    .from("zoom_meetings")
    .select(`
      id, title, class_id, host_id, start_time, status,
      class:classes(id, name)
    `)
    .eq("id", id)
    .single()

  if (meetingError || !meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  // Check if user has access (host, admin, or teacher of the class)
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const isHost = meeting.host_id === user.id
  const isAdmin = userData?.role === "admin"
  let isClassTeacher = false

  if (meeting.class_id) {
    const { data: classData } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", meeting.class_id)
      .single()
    isClassTeacher = classData?.teacher_id === user.id
  }

  if (!isHost && !isAdmin && !isClassTeacher) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  // Get participants
  const { data: participants, error: participantsError } = await supabase
    .from("zoom_participants")
    .select(`
      id, user_id, zoom_participant_id, name, email, 
      join_time, leave_time, duration, status, created_at,
      user:users(id, name, email, avatar, role)
    `)
    .eq("meeting_id", id)
    .order("join_time", { ascending: true })

  if (participantsError) {
    return NextResponse.json({ error: participantsError.message }, { status: 500 })
  }

  // If meeting is linked to a class, get expected attendees
  let expectedAttendees: Array<{
    id: string
    name: string
    email: string
    avatar?: string
    role: string
    attended: boolean
    participant?: typeof participants[0]
  }> = []

  if (meeting.class_id) {
    // Get all students enrolled in the class
    const { data: enrolledStudents } = await supabase
      .from("class_students")
      .select(`
        student:users!class_students_student_id_fkey(id, name, email, avatar, role)
      `)
      .eq("class_id", meeting.class_id)

    if (enrolledStudents) {
      expectedAttendees = enrolledStudents
        .filter(enrollment => enrollment.student)
        .map(enrollment => {
          const studentData = enrollment.student as unknown as { id: string; name: string; email: string; avatar?: string; role: string }
          const participant = participants?.find(p => p.user_id === studentData.id)
          return {
            ...studentData,
            attended: !!participant && (participant.status === "joined" || participant.status === "left"),
            participant: participant || undefined,
          }
        })
    }
  }

  // Calculate stats
  const joinedParticipants = participants?.filter(p => p.status === "joined" || p.status === "left") || []
  const totalDuration = joinedParticipants.reduce((sum, p) => sum + (p.duration || 0), 0)
  const avgDuration = joinedParticipants.length > 0 ? Math.round(totalDuration / joinedParticipants.length) : 0

  return NextResponse.json({
    meeting: {
      id: meeting.id,
      title: meeting.title,
      class: meeting.class,
      start_time: meeting.start_time,
      status: meeting.status,
    },
    participants: participants || [],
    expectedAttendees,
    stats: {
      totalParticipants: participants?.length || 0,
      joinedCount: joinedParticipants.length,
      expectedCount: expectedAttendees.length,
      attendanceRate: expectedAttendees.length > 0
        ? Math.round((expectedAttendees.filter(a => a.attended).length / expectedAttendees.length) * 100)
        : joinedParticipants.length > 0 ? 100 : 0,
      totalDurationSeconds: totalDuration,
      avgDurationSeconds: avgDuration,
    },
  })
}
