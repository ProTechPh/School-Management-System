import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import dns from "dns/promises"

// Helper to validate URLs and prevent Client-Side SSRF/Local Network Access
const isPrivateIP = (ip: string) => {
  const parts = ip.split('.').map(Number);
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.0.0.0/8
  if (parts[0] === 127) return true;
  // 169.254.0.0/16 (Link-local)
  if (parts[0] === 169 && parts[1] === 254) return true;
  return false;
}

const isValidUrl = async (url: string) => {
  try {
    const parsed = new URL(url)
    // Only allow http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false
    }
    
    const hostname = parsed.hostname.toLowerCase()
    
    // Block localhost explicitly
    if (hostname === 'localhost') return false
    
    // Check for IP literals directly
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
       return !isPrivateIP(hostname)
    }

    // Server-Side DNS Resolution to prevent Rebinding
    try {
      const addresses = await dns.resolve4(hostname);
      // If any resolved IP is private, reject the URL
      if (addresses.some(ip => isPrivateIP(ip))) return false;
    } catch (e) {
      // If DNS resolution fails, reject the URL for security
      console.error(`DNS resolution failed for ${hostname}:`, e)
      return false;
    }

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
    console.error("GET Lessons Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
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

    if (materials && Array.isArray(materials)) {
      for (const m of materials) {
        if (m.url) {
          const valid = await isValidUrl(m.url)
          if (!valid) {
            return NextResponse.json({ error: "Invalid URL. Links to private/local networks are not allowed." }, { status: 400 })
          }
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
    console.error("POST Lessons Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id, title, classId, description, content, materials, deletedMaterialIds } = body

    if (materials && Array.isArray(materials)) {
      for (const m of materials) {
        if (m.url) {
          const valid = await isValidUrl(m.url)
          if (!valid) {
            return NextResponse.json({ error: "Invalid URL. Links to private/local networks are not allowed." }, { status: 400 })
          }
        }
      }
    }

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
    console.error("PUT Lessons Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}