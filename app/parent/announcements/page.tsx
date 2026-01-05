"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Megaphone, AlertTriangle, Info } from "lucide-react"
import { announcements } from "@/lib/mock-data"
import { format } from "date-fns"

export default function ParentAnnouncementsPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const priorityConfig = {
    urgent: { label: "Urgent", variant: "destructive" as const, icon: AlertTriangle },
    important: { label: "Important", variant: "default" as const, icon: Megaphone },
    normal: { label: "Normal", variant: "secondary" as const, icon: Info },
  }

  // Filter announcements relevant to parents (all, students)
  const parentAnnouncements = announcements.filter(
    (a) => a.targetAudience === "all" || a.targetAudience === "students"
  )

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Announcements" subtitle="School announcements and updates" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Announcements"
        subtitle="School announcements and updates"
      />
      <div className="p-4 lg:p-6 space-y-4">
        {parentAnnouncements.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No announcements at this time.</p>
            </CardContent>
          </Card>
        ) : (
          parentAnnouncements.map((announcement) => {
            const config = priorityConfig[announcement.priority]
            const Icon = config.icon
            return (
              <Card key={announcement.id} className="bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        announcement.priority === "urgent" ? "bg-red-500/10" :
                        announcement.priority === "important" ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          announcement.priority === "urgent" ? "text-red-500" :
                          announcement.priority === "important" ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{announcement.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {announcement.authorName} • {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
