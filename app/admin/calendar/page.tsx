"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { CalendarView } from "@/components/calendar-view"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AdminCalendarPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Calendar" subtitle="Manage school-wide events and schedules" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Calendar"
        subtitle="Manage school-wide events and schedules"
        userId={userId}
      />
      <div className="p-4 lg:p-6">
        <CalendarView
          userId={userId}
          userRole="admin"
          classIds={[]}
          canCreate={true}
        />
      </div>
    </div>
  )
}
