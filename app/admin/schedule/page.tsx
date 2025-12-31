"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>("all")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    // Use secure API route
    try {
      const response = await fetch("/api/admin/schedule")
      if (response.ok) {
        const { schedules: data } = await response.json()
        if (data) {
          setSchedules(data.map((s: any) => ({
            id: s.id,
            day: s.day,
            start_time: s.start_time,
            end_time: s.end_time,
            room: s.room,
            class_name: s.class?.name || "Unknown",
            subject: s.class?.subject || "Unknown",
            teacher_name: s.class?.teacher?.name || null,
          })))
        }
      } else {
        throw new Error("Failed to fetch schedule")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load schedules")
    }

    setLoading(false)
  }

  const filteredSchedule = selectedDay === "all" 
    ? schedules 
    : schedules.filter((item) => item.day === selectedDay)

  const scheduleByDay = days.reduce((acc, day) => {
    acc[day] = filteredSchedule.filter((item) => item.day === day)
    return acc
  }, {} as Record<string, ScheduleItem[]>)

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Schedule" subtitle="View class schedules" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Schedule" subtitle="View class schedules" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {days.map((day) => (
                <SelectItem key={day} value={day}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6">
          {(selectedDay === "all" ? days : [selectedDay]).map((day) => (
            <Card key={day} className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleByDay[day]?.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {scheduleByDay[day]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((item) => (
                        <div key={item.id} className="rounded-lg border border-border bg-muted/30 p-3">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <p className="font-medium text-card-foreground">{item.class_name}</p>
                              <p className="text-sm text-muted-foreground">{item.teacher_name || "No teacher"}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">{item.subject}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                            <span>{item.room || "TBA"}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No classes scheduled</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}