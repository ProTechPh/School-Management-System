import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch calendar events
export async function GET(request: NextRequest) {
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

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  // Get user's class IDs
  let classIds: string[] = []
  
  if (userData.role === "student") {
    const { data: enrollments } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", user.id)
    classIds = enrollments?.map(e => e.class_id) || []
  } else if (userData.role === "teacher") {
    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", user.id)
    classIds = classes?.map(c => c.id) || []
  }

  // Build query based on role
  let query = supabase
    .from("calendar_events")
    .select(`
      *,
      class:classes(id, name)
    `)
    .order("start_date", { ascending: true })

  if (startDate) {
    query = query.gte("start_date", startDate)
  }
  if (endDate) {
    query = query.lte("start_date", endDate)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filter events based on visibility rules
  const filteredEvents = data?.filter(event => {
    if (event.target_audience === "all") return true
    if (event.target_audience === "personal" && event.created_by === user.id) return true
    if (event.target_audience === "teachers" && userData.role === "teacher") return true
    if (event.target_audience === "students" && userData.role === "student") return true
    if (event.target_audience === "class" && event.class_id && classIds.includes(event.class_id)) return true
    if (userData.role === "admin") return true
    return false
  }) || []

  return NextResponse.json({ events: filteredEvents })
}

// POST - Create calendar event
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { 
    title, 
    description, 
    type, 
    startDate, 
    endDate, 
    startTime, 
    endTime, 
    allDay, 
    location, 
    classId, 
    targetAudience 
  } = body

  if (!title || !startDate) {
    return NextResponse.json({ error: "Title and start date required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      title,
      description,
      type: type || "other",
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      all_day: allDay || false,
      location,
      class_id: classId,
      created_by: user.id,
      target_audience: targetAudience || "personal",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: data })
}
