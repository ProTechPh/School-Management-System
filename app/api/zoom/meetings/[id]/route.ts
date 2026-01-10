import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getZoomMeeting, updateZoomMeeting, deleteZoomMeeting, isZoomConfigured } from "@/lib/zoom"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single meeting
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: meeting, error } = await supabase
    .from("zoom_meetings")
    .select(`
      *,
      host:users!zoom_meetings_host_id_fkey(id, name, email, avatar),
      class:classes(id, name),
      participants:zoom_participants(
        id, user_id, name, email, join_time, leave_time, duration, status,
        user:users(id, name, email, avatar)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  return NextResponse.json({ meeting })
}

// PATCH - Update meeting
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  if (!isZoomConfigured()) {
    return NextResponse.json({ error: "Zoom is not configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get existing meeting
  const { data: existingMeeting } = await supabase
    .from("zoom_meetings")
    .select("*, host:users!zoom_meetings_host_id_fkey(id)")
    .eq("id", id)
    .single()

  if (!existingMeeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  // Check permissions
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (existingMeeting.host_id !== user.id && userData?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized to update this meeting" }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, startTime, duration, timezone, classId, targetAudience, settings } = body

  try {
    // Update in Zoom
    await updateZoomMeeting(existingMeeting.zoom_meeting_id, {
      topic: title,
      agenda: description,
      startTime,
      duration,
      timezone,
      settings,
    })

    // Update in database
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (startTime) updateData.start_time = startTime
    if (duration) updateData.duration = duration
    if (timezone) updateData.timezone = timezone
    if (classId !== undefined) updateData.class_id = classId
    if (targetAudience) updateData.target_audience = targetAudience
    if (settings) updateData.settings = settings

    const { data: meeting, error } = await supabase
      .from("zoom_meetings")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        host:users!zoom_meetings_host_id_fkey(id, name, email, avatar),
        class:classes(id, name)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error("Error updating meeting:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update meeting" },
      { status: 500 }
    )
  }
}

// DELETE - Delete meeting
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  if (!isZoomConfigured()) {
    return NextResponse.json({ error: "Zoom is not configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get existing meeting
  const { data: existingMeeting } = await supabase
    .from("zoom_meetings")
    .select("zoom_meeting_id, host_id")
    .eq("id", id)
    .single()

  if (!existingMeeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  // Check permissions
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (existingMeeting.host_id !== user.id && userData?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized to delete this meeting" }, { status: 403 })
  }

  try {
    // Delete from Zoom
    await deleteZoomMeeting(existingMeeting.zoom_meeting_id)

    // Delete from database (cascade will handle participants)
    const { error } = await supabase
      .from("zoom_meetings")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting meeting:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete meeting" },
      { status: 500 }
    )
  }
}
