"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, ExternalLink, Loader2, Calendar, ArrowRight } from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"
import Link from "next/link"
import type { ZoomMeeting } from "@/lib/zoom/types"
import type { UserRole } from "@/lib/types"

interface UpcomingMeetingsWidgetProps {
  userId: string
  userRole: UserRole
  limit?: number
}

export function UpcomingMeetingsWidget({ userId, userRole, limit = 3 }: UpcomingMeetingsWidgetProps) {
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const response = await fetch(`/api/zoom/meetings?upcoming=true&limit=${limit}`)
        if (response.ok) {
          const data = await response.json()
          setMeetings(data.meetings || [])
        }
      } catch (error) {
        console.error("Failed to fetch meetings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMeetings()
  }, [limit])

  const handleJoin = async (meeting: ZoomMeeting) => {
    try {
      const response = await fetch(`/api/zoom/meetings/${meeting.id}/join`)
      if (response.ok) {
        const joinInfo = await response.json()
        const url = meeting.host_id === userId && joinInfo.startUrl ? joinInfo.startUrl : joinInfo.joinUrl
        window.open(url, "_blank")
      }
    } catch (error) {
      console.error("Failed to join meeting:", error)
    }
  }

  const dashboardPath = userRole === "admin" ? "/admin" : userRole === "teacher" ? "/teacher" : userRole === "parent" ? "/parent" : "/student"

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-500" />
            Upcoming Meetings
          </CardTitle>
          <Link href={`${dashboardPath}/meetings`}>
            <Button variant="ghost" size="sm" className="text-xs">
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming meetings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const startTime = new Date(meeting.start_time)
              const isLive = meeting.status === "started" || (!isPast(new Date(startTime.getTime() + meeting.duration * 60000)) && isPast(startTime))

              return (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-full shrink-0 ${isLive ? "bg-green-500/10" : "bg-blue-500/10"}`}>
                      <Video className={`h-4 w-4 ${isLive ? "text-green-500" : "text-blue-500"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {isLive ? (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs px-1.5 py-0">
                            Live now
                          </Badge>
                        ) : (
                          formatDistanceToNow(startTime, { addSuffix: true })
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isLive ? "default" : "outline"}
                    className="shrink-0 ml-2"
                    onClick={() => handleJoin(meeting)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {meeting.host_id === userId ? "Start" : "Join"}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
