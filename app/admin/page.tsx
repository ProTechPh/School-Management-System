"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, BookOpen, TrendingUp, ClipboardCheck, Calendar, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface DashboardData {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  attendanceRate: number
  recentStudents: Array<{ id: string; name: string; avatar: string | null; grade: string; section: string }>
  recentAttendance: Array<{ id: string; student_name: string; date: string; status: string }>
  topGrades: Array<{ id: string; student_name: string; subject: string; score: number }>
  classes: Array<{ id: string; name: string; teacher_name: string; subject: string; room: string | null; student_count: number }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Get current user ID for header
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      // SECURITY FIX: Fetch dashboard data from secure API route
      try {
        const response = await fetch("/api/admin/dashboard")
        if (!response.ok) {
          throw new Error("Failed to load dashboard data")
        }
        const dashboardData = await response.json()
        setData(dashboardData)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Dashboard" subtitle="Welcome back, Admin" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Dashboard" subtitle="Welcome back, Admin" userId={userId} />
      <div className="p-4 lg:p-6">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={data?.totalStudents || 0} icon={Users} />
          <StatCard title="Total Teachers" value={data?.totalTeachers || 0} icon={GraduationCap} />
          <StatCard title="Active Classes" value={data?.totalClasses || 0} icon={BookOpen} />
          <StatCard title="Attendance Rate" value={`${data?.attendanceRate || 0}%`} icon={TrendingUp} />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Students */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Students</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {student.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">{student.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Grade {student.grade} - Section {student.section}
                      </p>
                    </div>
                  </div>
                ))}
                {(!data?.recentStudents || data.recentStudents.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No students yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Attendance</CardTitle>
              <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">{record.student_name}</p>
                      <p className="text-xs text-muted-foreground">{record.date}</p>
                    </div>
                    <Badge
                      variant={record.status === "present" ? "default" : record.status === "absent" ? "destructive" : "secondary"}
                      className="capitalize"
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))}
                {(!data?.recentAttendance || data.recentAttendance.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No attendance records</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topGrades.map((grade, index) => (
                  <div key={grade.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">{grade.student_name}</p>
                      <p className="text-xs text-muted-foreground">{grade.subject}</p>
                    </div>
                    <Badge variant="outline" className="font-semibold">{grade.score}%</Badge>
                  </div>
                ))}
                {(!data?.topGrades || data.topGrades.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No grades yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Overview */}
        <Card className="mt-6 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Classes Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.classes.map((cls) => (
                <div key={cls.id} className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-card-foreground">{cls.name}</h4>
                      <p className="text-sm text-muted-foreground">{cls.teacher_name}</p>
                    </div>
                    <Badge variant="secondary">{cls.subject}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{cls.student_count} students</span>
                    <span>{cls.room || "No room"}</span>
                  </div>
                </div>
              ))}
              {(!data?.classes || data.classes.length === 0) && (
                <p className="text-sm text-muted-foreground col-span-3 text-center py-4">No classes yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}