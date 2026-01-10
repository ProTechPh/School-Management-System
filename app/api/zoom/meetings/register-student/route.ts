import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { addMeetingRegistrant, isAllowedEmail, getDomainRestrictionError } from "@/lib/zoom"

/**
 * POST - Register a student for all upcoming class meetings
 * Called when a student is enrolled in a class
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!userData || userData.role !== "admin") {
    return NextResponse.json({ error: "Only admins can register students" }, { status: 403 })
  }

  const { studentId, classId } = await request.json()

  if (!studentId || !classId) {
    return NextResponse.json({ error: "studentId and classId are required" }, { status: 400 })
  }

  try {
    // Get student info
    const { data: student } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", studentId)
      .single()

    if (!student || !student.email) {
      return NextResponse.json({ error: "Student not found or has no email" }, { status: 404 })
    }

    // Check if student has valid DepEd email
    if (!isAllowedEmail(student.email)) {
      return NextResponse.json({ 
        error: getDomainRestrictionError(),
        code: "DOMAIN_RESTRICTED"
      }, { status: 403 })
    }

    // Get upcoming meetings for this class with registration enabled
    const { data: meetings } = await supabase
      .from("zoom_meetings")
      .select("id, zoom_meeting_id")
      .eq("class_id", classId)
      .eq("registration_enabled", true)
      .gte("start_time", new Date().toISOString())
      .in("status", ["scheduled", "started"])

    if (!meetings || meetings.length === 0) {
      return NextResponse.json({ message: "No upcoming meetings to register for", registered: 0 })
    }

    const registrations = []

    for (const meeting of meetings) {
      // Check if already registered
      const { data: existing } = await supabase
        .from("meeting_registrants")
        .select("id")
        .eq("meeting_id", meeting.id)
        .eq("user_id", studentId)
        .single()

      if (existing) continue

      try {
        // Register with Zoom
        const result = await addMeetingRegistrant(meeting.zoom_meeting_id, {
          email: student.email,
          firstName: student.name?.split(' ')[0] || 'Student',
          lastName: student.name?.split(' ').slice(1).join(' ') || '',
        })

        // Store in database
        await supabase.from("meeting_registrants").insert({
          meeting_id: meeting.id,
          user_id: studentId,
          zoom_registrant_id: result.registrant_id,
          join_url: result.join_url,
          status: 'approved',
        })

        registrations.push(meeting.id)
      } catch (err) {
        console.error(`Failed to register student for meeting ${meeting.id}:`, err)
      }
    }

    return NextResponse.json({ 
      message: `Registered for ${registrations.length} meetings`,
      registered: registrations.length,
      meetingIds: registrations,
    })
  } catch (error) {
    console.error("Error registering student:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register student" },
      { status: 500 }
    )
  }
}
