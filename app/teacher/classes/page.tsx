"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Clock, MapPin, ClipboardCheck, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface ClassInfo {
  id: string
  name: string
  grade: string
  section: string
  subject: string
  schedule: string | null
  room: string | null
  student_count: number
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
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

    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, grade, section, subject, schedule, room")
      .eq("teacher_id", user.id)
      .order("name")

    if (classData) {
      // Get student counts
      const { data: enrollments } = await supabase
        .from("class_students")
        .select("class_id")

      const countMap: Record<string, number> = {}
      enrollments?.forEach(e => {
        countMap[e.class_id] = (countMap[e.class_id] || 0) + 1
      })

      setClasses(classData.map(c => ({
        ...c,
        student_count: countMap[c.id] || 0,
      })))
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="My Classes" subtitle="Manage your assigned classes" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Classes" subtitle="Manage your assigned classes" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Grade {cls.grade} - Section {cls.section}</p>
                  </div>
                  <Badge variant="secondary">{cls.subject}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{cls.student_count} students enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{cls.schedule || "No schedule"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{cls.room || "TBA"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href="/teacher/attendance">
                      <ClipboardCheck className="mr-2 h-4 w-4" />Attendance
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href="/teacher/grades">
                      <BookOpen className="mr-2 h-4 w-4" />Grades
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-card-foreground">No Classes Assigned</h3>
            <p className="text-muted-foreground">You don&apos;t have any classes assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
