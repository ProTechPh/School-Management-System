import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch single assignment with submissions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: assignment, error } = await supabase
    .from("assignments")
    .select(`
      *,
      class:classes(id, name, subject),
      teacher:users!assignments_teacher_id_fkey(id, name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get submissions for this assignment
  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select(`
      *,
      student:users!assignment_submissions_student_id_fkey(id, name, avatar),
      files:submission_files(*)
    `)
    .eq("assignment_id", id)

  return NextResponse.json({ assignment, submissions: submissions || [] })
}

// PATCH - Update assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  // Whitelist allowed fields to prevent mass assignment
  const allowedFields = ['title', 'description', 'due_date', 'max_score', 'allow_late_submission', 'status']
  const updates = Object.keys(body)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => ({ ...obj, [key]: body[key] }), {})

  const { data, error } = await supabase
    .from("assignments")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("teacher_id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assignment: data })
}

// DELETE - Delete assignment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id)
    .eq("teacher_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
