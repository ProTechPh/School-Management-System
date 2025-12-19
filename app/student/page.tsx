"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, ClipboardCheck, TrendingUp, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: userData } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single()
    if (userData) setUserName(userData.name)

    // Fetch student's enrolled classes
    const { data: enrollments } = await supabase
      .from("class_students")
      .select(`
        class:classes (
          id, name, subject, schedule, room,
          teacher:users!classes_teacher_id_fkey (name)
        )
      `)
      .eq("student_id", user.id)

    if (enrollments) {
      const classData = enrollments.map(e => {
        const c = e.class as any
        return {
          id: c.id,
          name: c.name,
          subject: c.subject,
          schedule: c.schedule,
          room: c.room,
          teacher_name: c.teacher?.name || null,
        }
      })
      setClasses(classData)

      // Fetch today's schedule
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const today = days[new Date().getDay()]
      const classIds = classData.map(c => c.id)

      if (classIds.length > 0) {
        const { data: scheduleData } = await supabase
          .from("schedules")
          .select(`
            id, start_time, end_time, room,
            class:classes (name, teacher:users!classes_teacher_id_fkey (name))
          `)
          .in("class_id", classIds)
          .eq("day", today)
          .order("start_time")

        if (scheduleData) {
          setTodaySchedule(scheduleData.map(s => ({
            id: s.id,
            start_time: s.start_time,
            end_time: s.end_time,
            room: s.room,
            class_name: (s.class as any)?.name || "Unknown",
            teacher_name: (s.class as any)?.teacher?.name || null,
          })))
        }
      }
    }

    // Fetch grades
    const { data: gradeData } = await supabase
      .from("grades")
      .select(`
        id, score, max_score, grade, type,
        class:classes (name)
      `)
      .eq("student_id", user.id)
      .order("date", { ascending: false })
      .limit(5)

    if (gradeData) {
      setGrades(gradeData.map(g => ({
        id: g.id,
        class_name: (g.class as any)?.name || "Unknown",
        type: g.type,
        score: g.score,
        max_score: g.max_score,
        grade: g.grade,
      })))
    }

    // Calculate attendance rate
    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("student_id", user.id)

    if (attendance && attendance.length > 0) {
      const present = attendance.filter(a => a.status === "present").length
      setAttendanceRate(Math.round((present / attendance.length) * 100))
    }

    setLoading(false)
  }

  const avgGrade = grades.length
    ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length)
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
