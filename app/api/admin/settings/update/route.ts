import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

// Schema validation
const settingsSchema = z.object({
  name: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().min(10).max(5000), // Enforce reasonable bounds
})

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

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validation = settingsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid settings: " + validation.error.issues.map(e => e.message).join(", ") 
      }, { status: 400 })
    }

    const { name, latitude, longitude, radiusMeters } = validation.data

    const { error } = await supabase
      .from("school_settings")
      .upsert({
        id: "1", // Fixed ID
        name,
        latitude,
        longitude,
        radius_meters: radiusMeters,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}