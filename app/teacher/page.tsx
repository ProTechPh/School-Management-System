"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, ClipboardCheck, Calendar, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ClassInfo {
  id: string
  name: string
  grade: string
  section: string
  subject: string
  schedule: string | null
  room: string | null
}

interface ScheduleItem {
  id: string
  day: string
  start_time: string
  end_time: string
  room: string | null
  class_name: string
}

interface Student {
  id: string
  name: string
  avatar: string | null
  grade: string
  section: string
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null)

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

    // Fetch teacher's classes
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, grade, section, subject, schedule, room")
      .eq("teacher_id", user.id)
      .order("name")

    if (classData) {
      setClasses(classData)

      // Count students in teacher's classes
      const classIds = classData.map(c => c.id)
      if (classIds.length > 0) {
        const { count } = await supabase
          .from("class_students")
          .select("*", { count: "exact", head: true })
          .in("class_id", classIds)
        setTotalStudents(count || 0)

        // Calculate attendance rate for teacher's classes
        const { data: attendanceData } = await supabase
          .from("attendance_records")
          .select("status")
          .in("class_id", classIds)
        
        if (attendanceData && attendanceData.length > 0) {
          const presentCount = attendanceData.filter(a => a.status === "present" || a.status === "late").length
          const rate = (presentCount / attendanceData.length) * 100
          setAttendanceRate(Math.round(rate * 10) / 10)
        } else {
          setAttendanceRate(null)
        }

        // Fetch students in teacher's classes
        const { data: enrollments } = await supabase
          .from("class_students")
          .select(`
            student:users!class_students_student_id_fkey (id, name, avatar)
          `)
          .in("class_id", classIds)
          .limit(8)

        if (enrollments) {
          const uniqueStudents = new Map()
          for (const e of enrollments) {
            const s = e.student as any
            if (s && !uniqueStudents.has(s.id)) {
              // Fetch student profile separately
              const { data: profile } = await supabase
                .from("student_profiles")
                .select("grade, section")
                .eq("id", s.id)
                .single()
              
              uniqueStudents.set(s.id, {
                id: s.id,
                name: s.name,
                avatar: s.avatar,
                grade: profile?.grade || "N/A",
                section: profile?.section || "N/A",
              })
            }
          }
          setStudents(Array.from(uniqueStudents.values()).slice(0, 8))
        }
      }
    }

    // Fetch today's schedule
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const today = days[new Date().getDay()]

    const { data: scheduleData } = await supabase
      .from("schedules")
      .select(`
        id, day, start_time, end_time, room,
        class:classes!inner (name, teacher_id)
      `)
      .eq("day", today)
      .eq("class.teacher_id", user.id)
      .order("start_time")

    if (scheduleData) {
      setTodaySchedule(scheduleData.map(s => ({
        id: s.id,
        day: s.day,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room,
        class_name: (s.class as any)?.name || "Unknown",
      })))
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Teacher Dashboard" subtitle="Loading..." />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Teacher Dashboard"
        subtitle={`Welcome back, ${userName.split(" ")[0]}`}
        userId={userId}
      />
      <div className="p-4 lg:p-6">
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="My Classes" value={classes.length} icon={BookOpen} />
          <StatCard title="Total Students" value={totalStudents} icon={Users} />
          <StatCard title="Today's Classes" value={todaySchedule.length} icon={Calendar} />
          <StatCard title="Attendance Rate" value={attendanceRate !== null ? `${attendanceRate}%` : "N/A"} icon={ClipboardCheck} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-card-foreground">{cls.name}</h4>
                        <p className="text-sm text-muted-foreground">{cls.schedule || "No schedule"}</p>
                      </div>
                      <Badge variant="secondary">{cls.subject}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Grade {cls.grade} - {cls.section}</span>
                      <span>{cls.room || "TBA"}</span>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No classes assigned</p>
                )}
              </div>
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
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{item.start_time}</p>
                        <p className="text-xs text-muted-foreground">{item.end_time}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{item.class_name}</p>
                        <p className="text-sm text-muted-foreground">{item.room || "TBA"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No classes scheduled for today</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Students in My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {student.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground">Grade {student.grade}-{student.section}</p>
                    </div>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="col-span-full text-sm text-muted-foreground text-center py-4">No students enrolled</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
