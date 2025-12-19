"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, MapPin, Users, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ClassInfo {
  id: string
  name: string
  subject: string
  schedule: string | null
  room: string | null
  teacher_name: string | null
  teacher_avatar: string | null
  student_count: number
}

export default function StudentClassesPage() {
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

    const { data: enrollments } = await supabase
      .from("class_students")
      .select(`
        class:classes (
          id, name, subject, schedule, room,
          teacher:users!classes_teacher_id_fkey (name, avatar)
        )
      `)
      .eq("student_id", user.id)

    if (enrollments) {
      const classIds = enrollments.map(e => (e.class as any)?.id).filter(Boolean)
      
      // Get student counts
      const { data: allEnrollments } = await supabase
        .from("class_students")
        .select("class_id")
        .in("class_id", classIds)

      const countMap: Record<string, number> = {}
      allEnrollments?.forEach(e => {
        countMap[e.class_id] = (countMap[e.class_id] || 0) + 1
      })

      setClasses(enrollments.map(e => {
        const c = e.class as any
        return {
          id: c.id,
          name: c.name,
          subject: c.subject,
          schedule: c.schedule,
          room: c.room,
          teacher_name: c.teacher?.name || null,
          teacher_avatar: c.teacher?.avatar || null,
          student_count: countMap[c.id] || 0,
        }
      }))
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="My Classes" subtitle="View your enrolled classes" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Classes" subtitle="View your enrolled classes" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">{cls.subject}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={cls.teacher_avatar || "/placeholder.svg"} alt={cls.teacher_name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {cls.teacher_name?.split(" ").map((n) => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-card-foreground">{cls.teacher_name || "No teacher"}</p>
                    <p className="text-sm text-muted-foreground">Instructor</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{cls.schedule || "No schedule"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{cls.room || "TBA"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{cls.student_count} classmates</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">You are not enrolled in any classes yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
