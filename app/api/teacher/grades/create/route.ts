import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { percentageToPhGrade } from "@/lib/grade-utils"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting with secure IP
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "create-grade", 20, 60 * 1000) // Allow 20 grades/min
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Verify Teacher Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "teacher" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, classId, score, maxScore, type, date } = body

    // 3. Validation
    if (!studentId || !classId || score === undefined || !maxScore || !type || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const numericScore = Number(score)
    const numericMax = Number(maxScore)

    if (isNaN(numericScore) || isNaN(numericMax) || numericMax <= 0) {
      return NextResponse.json({ error: "Invalid score values" }, { status: 400 })
    }

    if (numericScore > numericMax) {
      return NextResponse.json({ error: "Score cannot be higher than max score" }, { status: 400 })
    }

    // 4. Verify Teacher owns the class (if teacher)
    if (userData.role === "teacher") {
      const { data: classData } = await supabase
        .from("classes")
        .select("teacher_id")
        .eq("id", classId)
        .single()
      
      if (!classData || classData.teacher_id !== user.id) {
        return NextResponse.json({ error: "You can only grade your own classes" }, { status: 403 })
      }
    }

    // 5. Verify Student is in class
    const { data: enrollment } = await supabase
      .from("class_students")
      .select("id")
      .eq("class_id", classId)
      .eq("student_id", studentId)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: "Student is not enrolled in this class" }, { status: 400 })
    }

    // 6. Server-Side Calculation
    const percentage = Math.round((numericScore / numericMax) * 100)
    const grade = percentageToPhGrade(percentage)

    // 7. Insert
    const { data, error } = await supabase
      .from("grades")
      .insert({
        student_id: studentId,
        class_id: classId,
        score: numericScore,
        max_score: numericMax,
        percentage,
        grade,
        type,
        date,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, grade: data })

  } catch (error: any) {
    console.error("Create grade error:", error)
    return NextResponse.json({ error: "Failed to create grade record." }, { status: 500 })
  }
}