import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
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

    if (userData?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { records } = body

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // SECURITY FIX: Verify ownership of ALL classes in the batch
    const uniqueClassIds = [...new Set(records.map((r: any) => r.class_id))]
    
    const { count, error: countError } = await supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .in("id", uniqueClassIds)
      .eq("teacher_id", user.id)

    if (countError) throw countError

    // If the number of owned classes found doesn't match the number of unique classes in the request,
    // it means the teacher is trying to submit attendance for a class they don't own.
    if (count !== uniqueClassIds.length) {
      return NextResponse.json({ error: "Forbidden: You do not own one or more classes in this batch" }, { status: 403 })
    }

    const { error } = await supabase.from("attendance_records").upsert(records, {
      onConflict: "student_id,class_id,date",
    })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}