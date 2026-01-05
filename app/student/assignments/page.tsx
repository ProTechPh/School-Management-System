"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { StudentAssignmentList } from "@/components/assignment-list"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function StudentAssignmentsPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [classIds, setClassIds] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    try {
      const response = await fetch("/api/student/dashboard")
      if (response.ok) {
        const data = await response.json()
        setUserName(data.userName)
        setClassIds(data.classes.map((c: { id: string }) => c.id))
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
        <DashboardHeader title="Assignments" subtitle="View and submit your assignments" />
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
        subtitle="View and submit your assignments"
        userId={userId}
      />
      <div className="p-4 lg:p-6">
        <StudentAssignmentList
          studentId={userId}
          studentName={userName}
          classIds={classIds}
        />
      </div>
    </div>
  )
}
