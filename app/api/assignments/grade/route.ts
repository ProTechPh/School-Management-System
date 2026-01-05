import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Grade a submission
export async function POST(request: NextRequest) {
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

  if (!userData || (userData.role !== "teacher" && userData.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { submissionId, score, feedback } = body

  if (!submissionId || score === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Verify teacher owns the assignment
  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select(`
      id,
      assignment:assignments(id, teacher_id, max_score)
    `)
    .eq("id", submissionId)
    .single()

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  const assignment = Array.isArray(submission.assignment) 
    ? submission.assignment[0] 
    : submission.assignment as { id: string; teacher_id: string; max_score: number }
  
  if (userData.role === "teacher" && assignment.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not your assignment" }, { status: 403 })
  }

  if (score < 0 || score > assignment.max_score) {
    return NextResponse.json({ error: `Score must be between 0 and ${assignment.max_score}` }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("assignment_submissions")
    .update({
      score,
      feedback,
      status: "graded",
      graded_at: new Date().toISOString(),
      graded_by: user.id,
    })
    .eq("id", submissionId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submission: data })
}
