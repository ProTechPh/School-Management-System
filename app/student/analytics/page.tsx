"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProgressAnalytics } from "@/components/progress-analytics"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function StudentAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")

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
        <DashboardHeader title="Progress Analytics" subtitle="Track your academic performance" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Progress Analytics"
        subtitle="Track your academic performance over time"
        userId={userId}
      />
      <div className="p-4 lg:p-6">
        <ProgressAnalytics
          studentId={userId}
          studentName={userName}
          showDetailed={true}
        />
      </div>
    </div>
  )
}
