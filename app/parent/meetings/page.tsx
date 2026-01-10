"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ZoomMeetingsList } from "@/components/zoom-meetings-list"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ParentMeetingsPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Zoom Meetings" subtitle="Loading..." />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Zoom Meetings"
        subtitle="View and join parent-teacher meetings"
        userId={userId}
      />
      <div className="p-4 lg:p-6">
        <ZoomMeetingsList
          userId={userId}
          userRole="parent"
          showCreateButton={false}
        />
      </div>
    </div>
  )
}
