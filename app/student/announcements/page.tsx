"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"

interface Announcement {
  id: string
  title: string
  content: string
  author_name: string
  target_audience: string
  priority: "normal" | "important" | "urgent"
  created_at: string
}

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
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

    try {
      // Use secure API route instead of direct DB query
      const response = await fetch("/api/student/announcements")
      if (!response.ok) throw new Error("Failed to fetch announcements")
      
      const { announcements: data } = await response.json()

      if (data) {
        setAnnouncements(data.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          author_name: a.author?.name || "Unknown",
          target_audience: a.target_audience,
          priority: a.priority,
          created_at: a.created_at,
        })))
      }
    } catch (error) {
      console.error("Error fetching announcements:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "important": return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge variant="destructive">Urgent</Badge>
      case "important": return <Badge className="bg-yellow-500 text-white">Important</Badge>
      default: return <Badge variant="secondary">Normal</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Announcements" subtitle="Stay updated with school announcements" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Announcements" subtitle="Stay updated with school announcements" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No announcements at this time</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getPriorityIcon(announcement.priority)}
                      <div>
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          By {announcement.author_name} • {format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    {getPriorityBadge(announcement.priority)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}