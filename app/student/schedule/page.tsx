"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Convert 24-hour time to 12-hour format
const formatTime = (time: string) => {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours, 10)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

interface ScheduleItem {
  id: string
  day: string
  start_time: string
  end_time: string
  room: string | null
  class_name: string
  subject: string
  teacher_name: string | null
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export default function StudentSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [classCount, setClassCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Get student's enrolled classes
    const { data: enrollments } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", user.id)

    if (enrollments && enrollments.length > 0) {
      const classIds = enrollments.map(e => e.class_id)
      setClassCount(classIds.length)

      const { data: scheduleData } = await supabase
        .from("schedules")
        .select(`
          id, day, start_time, end_time, room,
          class:classes (name, subject, teacher:users!classes_teacher_id_fkey (name))
        `)
        .in("class_id", classIds)
        .order("day")
        .order("start_time")

      if (scheduleData) {
        setSchedule(scheduleData.map(s => ({
          id: s.id,
          day: s.day,
          start_time: s.start_time,
          end_time: s.end_time,
          room: s.room,
          class_name: (s.class as any)?.name || "Unknown",
          subject: (s.class as any)?.subject || "Unknown",
          teacher_name: (s.class as any)?.teacher?.name || null,
        })))
      }
    }

    setLoading(false)
  }

  const scheduleByDay = days.reduce((acc, day) => {
    acc[day] = schedule.filter((item) => item.day === day)
    return acc
  }, {} as Record<string, ScheduleItem[]>)

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="My Schedule" subtitle="View your weekly class schedule" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Schedule" subtitle="View your weekly class schedule" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="grid gap-4 md:grid-cols-5">
          {days.map((day) => (
            <Card key={day} className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleByDay[day]?.length > 0 ? (
                  <div className="space-y-3">
                    {scheduleByDay[day]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((item) => (
                        <div key={item.id} className="rounded-lg border border-border bg-muted/30 p-2.5">
                          <p className="text-xs font-semibold text-primary">{formatTime(item.start_time)} - {formatTime(item.end_time)}</p>
                          <p className="mt-1 text-sm font-medium text-card-foreground">{item.class_name}</p>
                          <p className="text-xs text-muted-foreground">{item.teacher_name || "No teacher"}</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">{item.subject}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.room || "TBA"}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No classes</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Schedule Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{schedule.length}</p>
                <p className="text-sm text-muted-foreground">Classes per Week</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">{schedule.length}h</p>
                <p className="text-sm text-muted-foreground">Study Hours</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">{classCount}</p>
                <p className="text-sm text-muted-foreground">Enrolled Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
