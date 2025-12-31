import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { path } = await request.json()
    if (!path) {
      return NextResponse.json({ error: "Path required" }, { status: 400 })
    }

    // 1. Find the material record associated with this path
    // We assume the 'url' column in lesson_materials stores the storage path
    const { data: material, error: materialError } = await supabase
      .from("lesson_materials")
      .select(`
        id, 
        lesson:lessons (
          class_id,
          class:classes (
            teacher_id
          )
        )
      `)
      .eq("url", path)
      .single()

    if (materialError || !material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    const lesson = material.lesson as any
    const classId = lesson.class_id
    const teacherId = lesson.class.teacher_id

    // 2. Check Authorization
    let isAuthorized = false

    // Check if user is the teacher of the class
    if (teacherId === user.id) {
      isAuthorized = true
    } 
    // Check if user is a student enrolled in the class
    else {
      const { data: enrollment } = await supabase
        .from("class_students")
        .select("id")
        .eq("class_id", classId)
        .eq("student_id", user.id)
        .single()
      
      if (enrollment) {
        isAuthorized = true
      }
      
      // Check if user is admin
      if (!isAuthorized) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()
        
        if (userData?.role === "admin") {
          isAuthorized = true
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this material" }, { status: 403 })
    }

    // 3. Generate Signed URL
    const { data, error } = await supabase.storage
      .from("materials") 
      .createSignedUrl(path, 3600) // 1 hour expiry

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}