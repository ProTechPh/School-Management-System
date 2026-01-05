"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { TeacherAssignmentManager } from "@/components/teacher-assignment-manager"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function TeacherAssignmentsPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    try {
      const response = await fetch("/api/teacher/my-classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
      }

      const userResponse = await fetch("/api/auth/me")
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserName(userData.user.name)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Assignments" subtitle="Create and manage assignments" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Assignments"
        subtitle="Create and manage assignments for your classes"
        userId={userId}
      />
      <div className="p-4 lg:p-6">
        <TeacherAssignmentManager
          teacherId={userId}
          teacherName={userName}
          classes={classes}
        />
      </div>
    </div>
  )
}
