import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateOrigin } from "@/lib/security"
import { z } from "zod"

// Validation schema for assignment creation
const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  classId: z.string().uuid("Invalid class ID"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid due date format"),
  maxScore: z.number().min(1).max(1000).optional(),
  allowLateSubmission: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional(),
})

// GET - Fetch assignments
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
  const classId = searchParams.get("classId")

  let query = supabase
    .from("assignments")
    .select(`
      *,
      class:classes(id, name, subject),
      teacher:users!assignments_teacher_id_fkey(id, name)
    `)
    .order("due_date", { ascending: true })

  if (classId) {
    query = query.eq("class_id", classId)
  }

  if (userData.role === "teacher") {
    query = query.eq("teacher_id", user.id)
  } else if (userData.role === "student") {
    query = query.eq("status", "published")
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assignments: data })
}

// POST - Create assignment
export async function POST(request: NextRequest) {
  // SECURITY: CSRF Protection
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid Origin" }, { status: 403 })
  }

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

  try {
    const body = await request.json()
    
    // SECURITY: Validate input with Zod schema
    const validationResult = createAssignmentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: validationResult.error.issues[0]?.message || "Invalid input" 
      }, { status: 400 })
    }

    const { title, description, classId, dueDate, maxScore, allowLateSubmission, status } = validationResult.data

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        title,
        description: description || null,
        class_id: classId,
        teacher_id: user.id,
        due_date: dueDate,
        max_score: maxScore || 100,
        allow_late_submission: allowLateSubmission ?? true,
        status: status || "draft",
      })
      .select(`
        *,
        class:classes(id, name, subject),
        teacher:users!assignments_teacher_id_fkey(id, name)
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignment: data })
  } catch (error) {
    console.error("Request error:", error)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
