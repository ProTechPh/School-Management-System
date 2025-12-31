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

    // In a real app, verify the user has access to this specific lesson material
    // For now, we assume any authenticated user can access lesson materials

    // Assume 'materials' is a private bucket
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