import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Verify Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Fetch Unlinked Accounts Efficiently using RPC
    const { data: unlinkedStudents, error } = await supabase.rpc('get_unlinked_students')
    
    if (error) {
      // Fallback for development if migration hasn't run yet
      console.warn("RPC failed, falling back to legacy method:", error.message)
      return legacyFetch(supabase)
    }
    
    return NextResponse.json({ accounts: unlinkedStudents || [] })

  } catch (error: any) {
    console.error("Fetch unlinked accounts error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Fallback logic in case RPC is not deployed yet
async function legacyFetch(supabase: any) {
  // Use a smaller limit to prevent crashes in fallback mode
  const { data: profiles } = await supabase
    .from("student_profiles")
    .select("id")
  
  // Validate all IDs are proper UUIDs to prevent injection
  const linkedIds = (profiles?.map((p: any) => p.id) || []).filter(
    (id: string) => UUID_REGEX.test(id)
  )

  // If list is too big, just return empty to prevent crash
  if (linkedIds.length > 1000) {
    return NextResponse.json({ 
      accounts: [], 
      warning: "Too many profiles for legacy fetch. Please run database migrations." 
    })
  }

  let query = supabase
    .from("users")
    .select("id, email, name")
    .eq("role", "student")
    .limit(100) // Safety limit
  
  if (linkedIds.length > 0) {
    // SECURITY FIX: Use proper array syntax instead of string interpolation
    query = query.not('id', 'in', linkedIds)
  }
  
  const { data: unlinkedStudents } = await query
  return NextResponse.json({ accounts: unlinkedStudents || [] })
}