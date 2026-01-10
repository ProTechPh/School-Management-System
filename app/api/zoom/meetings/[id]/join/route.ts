import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateSdkSignature, isZoomSdkConfigured, isAllowedEmail, getDomainRestrictionError } from "@/lib/zoom"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get join info for a meeting
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user info
  const { data: userData } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("id", user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Get meeting
  const { data: meeting } = await supabase
    .from("zoom_meetings")
    .select("*")
    .eq("id", id)
    .single()

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  // Check if meeting is cancelled
  if (meeting.status === "cancelled") {
    return NextResponse.json({ error: "This meeting has been cancelled" }, { status: 400 })
  }

  // Determine if user is host
  const isHost = meeting.host_id === user.id

  // For class meetings, check if user is authorized to join
  const isClassMeeting = !!meeting.class_id
  if (isClassMeeting && !isHost) {
    // Students: Must have DepEd email AND be enrolled in the class
    if (userData.role === "student") {
      // Check domain restriction (only for students)
      if (!isAllowedEmail(userData.email)) {
        return NextResponse.json({ 
          error: getDomainRestrictionError(),
          code: "DOMAIN_RESTRICTED"
        }, { status: 403 })
      }

      // Check if enrolled in the class
      const { data: enrollment } = await supabase
        .from("class_students")
        .select("id")
        .eq("class_id", meeting.class_id)
        .eq("student_id", user.id)
        .single()

      if (!enrollment) {
        return NextResponse.json({ 
          error: "You are not enrolled in this class",
          code: "NOT_ENROLLED"
        }, { status: 403 })
      }
    }

    // Parents: Must have a child enrolled in the class (no domain restriction)
    if (userData.role === "parent") {
      const { data: childEnrollment } = await supabase
        .from("parent_children")
        .select(`
          student_id,
          enrollment:class_students!inner(id)
        `)
        .eq("parent_id", user.id)
        .eq("class_students.class_id", meeting.class_id)
        .limit(1)

      if (!childEnrollment || childEnrollment.length === 0) {
        return NextResponse.json({ 
          error: "None of your children are enrolled in this class",
          code: "NOT_ENROLLED"
        }, { status: 403 })
      }
    }

    // Teachers and Admins: Can join any class meeting (no restrictions)
  }

  // Check if user has a personalized join URL (from registration)
  let personalizedJoinUrl: string | null = null
  if (meeting.registration_enabled && !isHost) {
    const { data: registration } = await supabase
      .from("meeting_registrants")
      .select("join_url")
      .eq("meeting_id", id)
      .eq("user_id", user.id)
      .single()
    
    if (registration?.join_url) {
      personalizedJoinUrl = registration.join_url
    }
  }

  // Build response
  const response: {
    joinUrl: string
    startUrl?: string
    password?: string
    meetingNumber: string
    isHost: boolean
    sdkSignature?: string
    sdkKey?: string
    userName: string
    userEmail: string
    isRegistered?: boolean
  } = {
    joinUrl: personalizedJoinUrl || meeting.join_url,
    password: meeting.password,
    meetingNumber: meeting.zoom_meeting_id,
    isHost,
    userName: userData.name,
    userEmail: userData.email,
    isRegistered: !!personalizedJoinUrl,
  }

  // Include start URL for host
  if (isHost && meeting.start_url) {
    response.startUrl = meeting.start_url
  }

  // Generate SDK signature if SDK is configured
  if (isZoomSdkConfigured()) {
    try {
      response.sdkSignature = generateSdkSignature({
        meetingNumber: meeting.zoom_meeting_id,
        role: isHost ? 1 : 0,
      })
      response.sdkKey = process.env.ZOOM_SDK_KEY
    } catch (error) {
      console.error("Error generating SDK signature:", error)
      // Continue without SDK - user can still use join URL
    }
  }

  // Record that user is joining (create participant record if not exists)
  await supabase
    .from("zoom_participants")
    .upsert({
      meeting_id: id,
      user_id: user.id,
      name: userData.name,
      email: userData.email,
      status: "invited",
    }, {
      onConflict: "meeting_id,user_id",
      ignoreDuplicates: true,
    })

  return NextResponse.json(response)
}

// POST - Record join/leave events
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body // 'join' or 'leave'

  if (!["join", "leave"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const now = new Date().toISOString()

  if (action === "join") {
    await supabase
      .from("zoom_participants")
      .upsert({
        meeting_id: id,
        user_id: user.id,
        join_time: now,
        status: "joined",
      }, {
        onConflict: "meeting_id,user_id",
      })
  } else {
    // Calculate duration
    const { data: participant } = await supabase
      .from("zoom_participants")
      .select("join_time")
      .eq("meeting_id", id)
      .eq("user_id", user.id)
      .single()

    let duration = 0
    if (participant?.join_time) {
      duration = Math.floor((new Date(now).getTime() - new Date(participant.join_time).getTime()) / 1000)
    }

    await supabase
      .from("zoom_participants")
      .update({
        leave_time: now,
        duration,
        status: "left",
      })
      .eq("meeting_id", id)
      .eq("user_id", user.id)
  }

  return NextResponse.json({ success: true })
}
