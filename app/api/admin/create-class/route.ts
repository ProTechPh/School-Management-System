import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

// Helper to calculate schedule
const convertTo24Hour = (time12: string) => {
  const [time, modifier] = time12.split(" ")
  let [hours, minutes] = time.split(":")
  let h = parseInt(hours, 10)
  if (modifier === "PM" && h !== 12) h += 12
  if (modifier === "AM" && h === 12) h = 0
  return `${h.toString().padStart(2, "0")}:${minutes}:00`
}

const getDaysFromCode = (code: string): string[] => {
  const dayMap: Record<string, string[]> = {
    "MWF": ["Monday", "Wednesday", "Friday"],
    "TTh": ["Tuesday", "Thursday"],
    "Daily": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "MF": ["Monday", "Friday"],
    "MW": ["Monday", "Wednesday"],
    "WF": ["Wednesday", "Friday"],
  }
  return dayMap[code] || ["Monday", "Wednesday", "Friday"]
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "create-class", 10, 60 * 1000) // 10 classes per minute
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify Admin Role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, grade, section, subject, teacher_id, room, scheduleDays, scheduleTime } = body

    if (!name || !subject) {
      return NextResponse.json({ error: "Name and Subject are required" }, { status: 400 })
    }

    const scheduleString = scheduleDays && scheduleTime ? `${scheduleDays} ${scheduleTime}` : null

    // 1. Create Class
    const { data: newClass, error: classError } = await supabase
      .from("classes")
      .insert({
        name,
        grade,
        section,
        subject,
        teacher_id: teacher_id || null,
        room: room || null,
        schedule: scheduleString,
      })
      .select()
      .single()

    if (classError) throw classError

    // 2. Create Schedule Entries
    if (scheduleDays && scheduleTime) {
      const days = getDaysFromCode(scheduleDays)
      const startTime = convertTo24Hour(scheduleTime)
      const startHour = parseInt(startTime.split(":")[0], 10)
      // Simple logic: 1 hour duration
      const endTime = `${(startHour + 1).toString().padStart(2, "0")}:00:00`

      const scheduleEntries = days.map(day => ({
        class_id: newClass.id,
        day,
        start_time: startTime,
        end_time: endTime,
        room: room || null,
      }))

      const { error: scheduleError } = await supabase.from("schedules").insert(scheduleEntries)
      
      if (scheduleError) {
        // Rollback class creation if scheduling fails
        await supabase.from("classes").delete().eq("id", newClass.id)
        throw scheduleError
      }
    }

    return NextResponse.json({ success: true, class: newClass })

  } catch (error: any) {
    console.error("Create class error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}