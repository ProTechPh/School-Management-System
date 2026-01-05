import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Submit assignment
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single()

  if (!userData || userData.role !== "student") {
    return NextResponse.json({ error: "Only students can submit assignments" }, { status: 403 })
  }

  const body = await request.json()
  const { assignmentId, comment, files } = body

  if (!assignmentId) {
    return NextResponse.json({ error: "Assignment ID required" }, { status: 400 })
  }

  // Check if assignment exists and is published
  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, class:classes(id)")
    .eq("id", assignmentId)
    .eq("status", "published")
    .single()

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found or not published" }, { status: 404 })
  }

  // Check if student is enrolled in the class
  const { data: enrollment } = await supabase
    .from("class_students")
    .select("id")
    .eq("class_id", assignment.class_id)
    .eq("student_id", user.id)
    .single()

  if (!enrollment) {
    return NextResponse.json({ error: "Not enrolled in this class" }, { status: 403 })
  }

  // Check if already submitted
  const { data: existingSubmission } = await supabase
    .from("assignment_submissions")
    .select("id")
    .eq("assignment_id", assignmentId)
    .eq("student_id", user.id)
    .single()

  if (existingSubmission) {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 })
  }

  // Determine if late
  const isLate = new Date() > new Date(assignment.due_date)
  if (isLate && !assignment.allow_late_submission) {
    return NextResponse.json({ error: "Late submissions not allowed" }, { status: 400 })
  }

  // Create submission
  const { data: submission, error } = await supabase
    .from("assignment_submissions")
    .insert({
      assignment_id: assignmentId,
      student_id: user.id,
      comment,
      status: isLate ? "late" : "submitted",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add files if provided
  if (files && files.length > 0) {
    const fileRecords = files.map((file: { name: string; type: string; url: string; size: string }) => ({
      submission_id: submission.id,
      name: file.name,
      type: file.type,
      url: file.url,
      size: file.size,
    }))

    await supabase.from("submission_files").insert(fileRecords)
  }

  return NextResponse.json({ submission })
}
