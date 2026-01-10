import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createZoomMeeting, isZoomConfigured } from "@/lib/zoom"
import type { CreateZoomMeetingRequest } from "@/lib/zoom"

// GET - List meetings
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const classId = searchParams.get("classId")
  const upcoming = searchParams.get("upcoming") === "true"
  const limit = parseInt(searchParams.get("limit") || "50")

  let query = supabase
    .from("zoom_meetings")
    .select(`
      *,
      host:users!zoom_meetings_host_id_fkey(id, name, email, avatar),
      class:classes(id, name)
    `)
    .order("start_time", { ascending: true })
    .limit(limit)

  if (status) {
    query = query.eq("status", status)
  }

  if (classId) {
    query = query.eq("class_id", classId)
  }

  if (upcoming) {
    query = query.gte("start_time", new Date().toISOString())
    query = query.in("status", ["scheduled", "started"])
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching meetings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ meetings: data || [] })
}

// POST - Create meeting
export async function POST(request: NextRequest) {
  if (!isZoomConfigured()) {
    return NextResponse.json({ error: "Zoom is not configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is teacher or admin
  const { data: userData } = await supabase
    .from("users")
    .select("role, name, email")
    .eq("id", user.id)
    .single()

  if (!userData || !["teacher", "admin"].includes(userData.role)) {
    return NextResponse.json({ error: "Only teachers and admins can create meetings" }, { status: 403 })
  }

  const body: CreateZoomMeetingRequest = await request.json()
  const { title, description, startTime, duration, timezone, classId, targetAudience, settings } = body

  if (!title || !startTime || !duration) {
    return NextResponse.json({ error: "Title, start time, and duration are required" }, { status: 400 })
  }

  try {
    // Create meeting in Zoom
    const zoomMeeting = await createZoomMeeting({
      topic: title,
      agenda: description,
      startTime,
      duration,
      timezone,
      settings,
    })

    console.log("Zoom API response - meeting ID:", zoomMeeting.id, "type:", typeof zoomMeeting.id)

    // Store in database
    const { data: meeting, error: dbError } = await supabase
      .from("zoom_meetings")
      .insert({
        zoom_meeting_id: zoomMeeting.id.toString(),
        host_id: user.id,
        title,
        description,
        meeting_type: "scheduled",
        start_time: startTime,
        duration,
        timezone: timezone || "UTC",
        join_url: zoomMeeting.join_url,
        start_url: zoomMeeting.start_url,
        password: zoomMeeting.password,
        class_id: classId,
        target_audience: targetAudience || "class",
        settings: settings || {},
      })
      .select(`
        *,
        host:users!zoom_meetings_host_id_fkey(id, name, email, avatar),
        class:classes(id, name)
      `)
      .single()

    if (dbError) {
      console.error("Error storing meeting:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Create calendar event for the meeting
    await supabase.from("calendar_events").insert({
      title: `📹 ${title}`,
      description: description || `Zoom meeting: ${title}`,
      type: "meeting",
      start_date: startTime.split("T")[0],
      start_time: startTime.split("T")[1]?.substring(0, 5),
      end_time: calculateEndTime(startTime, duration),
      all_day: false,
      location: zoomMeeting.join_url,
      class_id: classId,
      created_by: user.id,
      target_audience: targetAudience || "class",
    })

    // Send notifications to participants
    await sendMeetingNotifications(supabase, meeting, userData.name)

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    console.error("Error creating Zoom meeting:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create meeting" },
      { status: 500 }
    )
  }
}

function calculateEndTime(startTime: string, duration: number): string {
  const start = new Date(startTime)
  start.setMinutes(start.getMinutes() + duration)
  return start.toISOString().split("T")[1]?.substring(0, 5) || ""
}

async function sendMeetingNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  meeting: { title: string; class_id?: string; target_audience: string; start_time: string; join_url: string },
  hostName: string
) {
  const userIds: string[] = []

  if (meeting.target_audience === "all") {
    const { data } = await supabase.from("users").select("id")
    userIds.push(...(data?.map(u => u.id) || []))
  } else if (meeting.target_audience === "class" && meeting.class_id) {
    // Get students in class
    const { data: students } = await supabase
      .from("class_students")
      .select("student_id")
      .eq("class_id", meeting.class_id)
    userIds.push(...(students?.map(s => s.student_id) || []))

    // Get parents of students
    const { data: parents } = await supabase
      .from("parent_children")
      .select("parent_id")
      .in("child_id", userIds)
    userIds.push(...(parents?.map(p => p.parent_id) || []))
  } else if (meeting.target_audience === "teachers") {
    const { data } = await supabase.from("users").select("id").eq("role", "teacher")
    userIds.push(...(data?.map(u => u.id) || []))
  } else if (meeting.target_audience === "students") {
    const { data } = await supabase.from("users").select("id").eq("role", "student")
    userIds.push(...(data?.map(u => u.id) || []))
  }

  // Create notifications
  const notifications = userIds.map(userId => ({
    user_id: userId,
    title: "New Zoom Meeting Scheduled",
    message: `${hostName} scheduled "${meeting.title}" for ${new Date(meeting.start_time).toLocaleString()}`,
    type: "info",
    read: false,
    link: meeting.join_url,
  }))

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications)
  }
}
