import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Helper to validate URLs and prevent Client-Side SSRF/Local Network Access
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    // Only allow http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false
    }
    
    const hostname = parsed.hostname.toLowerCase()
    
    // Block localhost
    if (hostname === 'localhost') return false
    
    // Check for IPv4 private ranges
    // 10.0.0.0 - 10.255.255.255
    if (hostname.startsWith('10.')) return false
    
    // 192.168.0.0 - 192.168.255.255
    if (hostname.startsWith('192.168.')) return false
    
    // 172.16.0.0 - 172.31.255.255
    if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return false
    
    // 127.0.0.0 - 127.255.255.255 (Loopback)
    if (hostname.startsWith('127.')) return false
    
    // 169.254.0.0 - 169.254.255.255 (Link-local)
    if (hostname.startsWith('169.254.')) return false

    // IPv6 Loopback
    if (hostname === '[::1]') return false

    return true
  } catch {
    return false
  }
}

export async function GET(request: Request) {
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

    if (userData?.role !== "teacher" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only fetch lessons created by this teacher
    const { data: lessons, error } = await supabase
      .from("lessons")
      .select(`
        id, title, description, content, class_id, updated_at,
        class:classes (name),
        materials:lesson_materials (id, name, type, url)
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    // SECURITY FIX: DTO Pattern
    const safeLessons = lessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      content: l.content,
      class_id: l.class_id,
      class_name: l.class?.name || "Unknown",
      materials: l.materials?.map((m: any) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        url: m.url
      })) || [],
      updated_at: l.updated_at
    }))

    return NextResponse.json({ lessons: safeLessons })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (userData?.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { title, classId, description, content, materials } = body

    if (!title || !classId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    // SECURITY FIX: Validate URLs
    if (materials && Array.isArray(materials)) {
      for (const m of materials) {
        if (m.url && !isValidUrl(m.url)) {
          return NextResponse.json({ error: "Invalid URL. Links to private/local networks are not allowed." }, { status: 400 })
        }
      }
    }

    const { data: lesson, error } = await supabase
      .from("lessons")
      .insert({
        title,
        class_id: classId,
        teacher_id: user.id,
        description: description || null,
        content: content || null,
      })
      .select()
      .single()

    if (error) throw error

    if (materials && materials.length > 0) {
      const materialsToInsert = materials
        .filter((m: any) => m.name && m.url)
        .map((m: any) => ({
          lesson_id: lesson.id,
          name: m.name,
          type: m.type,
          url: m.url,
        }))
      
      if (materialsToInsert.length > 0) {
        await supabase.from("lesson_materials").insert(materialsToInsert)
      }
    }

    return NextResponse.json({ success: true, lesson })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id, title, classId, description, content, materials, deletedMaterialIds } = body

    // SECURITY FIX: Validate URLs in updated materials
    if (materials && Array.isArray(materials)) {
      for (const m of materials) {
        if (m.url && !isValidUrl(m.url)) {
          return NextResponse.json({ error: "Invalid URL. Links to private/local networks are not allowed." }, { status: 400 })
        }
      }
    }

    // Verify ownership
    const { data: existingLesson } = await supabase
      .from("lessons")
      .select("teacher_id")
      .eq("id", id)
      .single()
    
    if (!existingLesson || existingLesson.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase
      .from("lessons")
      .update({
        title,
        class_id: classId,
        description: description || null,
        content: content || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    if (deletedMaterialIds?.length > 0) {
      await supabase.from("lesson_materials").delete().in("id", deletedMaterialIds)
    }

    // Handle upserts/inserts for materials
    if (materials && materials.length > 0) {
      for (const m of materials) {
        if (m.isNew) {
           await supabase.from("lesson_materials").insert({
             lesson_id: id,
             name: m.name,
             type: m.type,
             url: m.url
           })
        } else if (!m.id.startsWith("temp-")) {
           await supabase.from("lesson_materials").update({
             name: m.name,
             url: m.url
           }).eq("id", m.id)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}