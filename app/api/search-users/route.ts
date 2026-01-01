import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

export async function GET(request: Request) {
  try {
    // 1. Strict Rate Limiting (5 requests per minute) with secure IP
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "search-users", 5, 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many search attempts. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const roleFilter = searchParams.get("role")

    // 2. Minimum Character Limit (Increased to 3)
    if (!query || query.length < 3) {
      return NextResponse.json({ users: [] })
    }

    // Get requester role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const requesterRole = userData?.role

    // SECURITY FIX: Restricted Search Scope
    let searchResults: any[] = []

    if (requesterRole === "student") {
      // Students can ONLY search for teachers
      const { data } = await supabase
        .from("users")
        .select("id, name, avatar, role")
        .eq("role", "teacher")
        .ilike("name", `%${query}%`)
        .limit(10)
      
      searchResults = data || []
    } 
    else if (requesterRole === "teacher") {
      // Teachers can search:
      // 1. Other Teachers
      // 2. Admins
      // 3. ONLY Students enrolled in their classes
      
      // First, get enrolled student IDs
      const { data: myClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id)
      
      const classIds = myClasses?.map(c => c.id) || []
      
      let enrolledStudentIds: string[] = []
      if (classIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("class_students")
          .select("student_id")
          .in("class_id", classIds)
        
        enrolledStudentIds = enrollments?.map(e => e.student_id) || []
      }

      // Query 1: Teachers/Admins
      const { data: staff } = await supabase
        .from("users")
        .select("id, name, avatar, role")
        .in("role", ["teacher", "admin"])
        .neq("id", user.id)
        .ilike("name", `%${query}%`)
        .limit(10)

      // Query 2: My Students (Strictly Scoped)
      let students: any[] = []
      
      // Only attempt to fetch students if the teacher actually has students enrolled
      if (enrolledStudentIds.length > 0 && (!roleFilter || roleFilter === "student")) {
        const { data: myStudents } = await supabase
          .from("users")
          .select("id, name, avatar, role")
          .in("id", enrolledStudentIds) // STRICT FILTER
          .ilike("name", `%${query}%`)
          .limit(10)
        
        students = myStudents || []
      }

      // Merge and dedupe
      const combined = [...(staff || []), ...students]
      // Simple dedupe by ID just in case
      const unique = Array.from(new Map(combined.map(u => [u.id, u])).values())
      
      // Apply role filter if present
      searchResults = roleFilter 
        ? unique.filter(u => u.role === roleFilter)
        : unique
        
      // Slice to limit
      searchResults = searchResults.slice(0, 10)
    } 
    else {
      // Admins can search everyone
      let dbQuery = supabase
        .from("users")
        .select("id, name, avatar, role")
        .neq("id", user.id)
        .ilike("name", `%${query}%`)
        .limit(10)
        
      if (roleFilter) {
        dbQuery = dbQuery.eq("role", roleFilter)
      }
      
      const { data } = await dbQuery
      searchResults = data || []
    }

    return NextResponse.json({ users: searchResults })
  } catch (error: any) {
    console.error("Search users error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}