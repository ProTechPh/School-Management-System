import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { handleApiError, ApiErrors } from "@/lib/api-errors"

/**
 * 文件 URL 验证 - 只允许来自 Supabase 存储的 URL
 * File URL validation - Only allow URLs from Supabase storage
 */
const createFileSchema = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  
  return z.object({
    name: z.string().max(255, "File name too long"),
    type: z.string().max(50, "File type too long"),
    url: z.string().url("Invalid URL").refine(
      (url) => {
        try {
          const parsed = new URL(url)
          const allowedHost = new URL(supabaseUrl).host
          // 只允许来自同一 Supabase 项目的 URL
          return parsed.host === allowedHost || parsed.host.endsWith('.supabase.co')
        } catch {
          return false
        }
      },
      { message: "File URL must be from authorized storage" }
    ),
    size: z.string().max(20, "Size format invalid"),
  })
}

const submissionSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  comment: z.string().max(5000, "Comment too long").optional(),
  files: z.array(createFileSchema()).max(10, "Maximum 10 files allowed").optional(),
})

// POST - Submit assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiErrors.unauthorized()
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role, name")
      .eq("id", user.id)
      .single()

    if (!userData || userData.role !== "student") {
      return ApiErrors.forbidden()
    }

    // SECURITY FIX: Validate input with Zod schema
    const body = await request.json()
    const validationResult = submissionSchema.safeParse(body)

    if (!validationResult.success) {
      return ApiErrors.badRequest(validationResult.error.errors[0]?.message || "Invalid submission data")
    }

    const { assignmentId, comment, files } = validationResult.data

    // Check if assignment exists and is published
    const { data: assignment } = await supabase
      .from("assignments")
      .select("*, class:classes(id)")
      .eq("id", assignmentId)
      .eq("status", "published")
      .single()

    if (!assignment) {
      return ApiErrors.notFound("Assignment")
    }

    // Check if student is enrolled in the class
    const { data: enrollment } = await supabase
      .from("class_students")
      .select("id")
      .eq("class_id", assignment.class_id)
      .eq("student_id", user.id)
      .single()

    if (!enrollment) {
      return ApiErrors.forbidden()
    }

    // Check if already submitted
    const { data: existingSubmission } = await supabase
      .from("assignment_submissions")
      .select("id")
      .eq("assignment_id", assignmentId)
      .eq("student_id", user.id)
      .single()

    if (existingSubmission) {
      return ApiErrors.badRequest("Already submitted")
    }

    // Determine if late
    const isLate = new Date() > new Date(assignment.due_date)
    if (isLate && !assignment.allow_late_submission) {
      return ApiErrors.badRequest("Late submissions not allowed")
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

    if (error) throw error

    // Add validated files if provided
    if (files && files.length > 0) {
      const fileRecords = files.map((file) => ({
        submission_id: submission.id,
        name: file.name,
        type: file.type,
        url: file.url,
        size: file.size,
      }))

      await supabase.from("submission_files").insert(fileRecords)
    }

    return NextResponse.json({ submission })
  } catch (error) {
    return handleApiError(error, "assignment-submit")
  }
}
