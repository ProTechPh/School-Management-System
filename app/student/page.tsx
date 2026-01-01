"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, ClipboardCheck, TrendingUp, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ClassInfo {
  id: string
  name: string
  subject: string
  schedule: string | null
  room: string | null
  teacher_name: string | null
}

interface Grade {
  id: string
  class_name: string
  type: string
  score: number
  max_score: number
  grade: number
}

interface ScheduleItem {
  id: string
  start_time: string
  end_time: string
  room: string | null
  class_name: string
  teacher_name: string | null
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([])
  const [attendanceRate, setAttendanceRate] = useState(100)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    // Get user session for the header ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // SECURITY FIX: Use secure API route instead of direct client-side DB queries
    try {
      const response = await fetch("/api/student/dashboard")
      if (!response.ok) {
        throw new Error("Failed to load dashboard data")
      }
      
      const data = await response.json()
      
      setUserName(data.userName)
      setClasses(data.classes)
      setTodaySchedule(data.todaySchedule)
      setGrades(data.grades)
      setAttendanceRate(data.attendanceRate)
      
    } catch (error) {
      console.error("Dashboard error:", error)
      toast.error("Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  const avgGrade = grades.length
    ? Math.round(grades.reduce((sum, g) => sum + g.grade, 0) / grades.length)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Student Dashboard" subtitle="Loading..." />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Student Dashboard"
        subtitle={`Welcome back, ${userName.split(" ")[0]}`}
        userId={userId}
      />
      <div className="p-4 lg:p-6">
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="My Classes" value={classes.length} icon={BookOpen} />
          <StatCard title="Average Grade" value={`${avgGrade}%`} icon={TrendingUp} />
          <StatCard title="Attendance Rate" value={`${attendanceRate}%`} icon={ClipboardCheck} />
          <StatCard title="Today's Classes" value={todaySchedule.length} icon={Calendar} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Grades</CardTitle>
            </CardHeader>
            <CardContent>
              {grades.length > 0 ? (
                <div className="space-y-4">
                  {grades.map((grade) => (
                    <div key={grade.id} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-card-foreground">{grade.class_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{grade.type}</p>
                        </div>
                        <Badge variant={grade.grade >= 90 ? "default" : grade.grade >= 75 ? "secondary" : "destructive"}>
                          {grade.grade}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={(grade.score / grade.max_score) * 100} className="flex-1" />
                        <span className="text-sm font-medium text-card-foreground">{grade.score}/{grade.max_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No grades recorded yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {todaySchedule.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedule.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold text-primary">{item.start_time}</p>
                        <p className="text-xs text-muted-foreground">{item.end_time}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{item.class_name}</p>
                        <p className="text-sm text-muted-foreground">{item.teacher_name || "No teacher"}</p>
                      </div>
                      <Badge variant="outline">{item.room || "TBA"}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No classes scheduled for today</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="font-medium text-card-foreground">{cls.name}</h4>
                      <Badge variant="secondary">{cls.subject}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{cls.teacher_name || "No teacher"}</p>
                    <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{cls.schedule || "No schedule"}</span>
                      <span>{cls.room || "TBA"}</span>
                    </div>
                  </div>
                ))}
              </div>
              {classes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Not enrolled in any classes</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}