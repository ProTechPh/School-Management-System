"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Video, Plus, Loader2, Calendar } from "lucide-react"
import { ZoomMeetingCard } from "./zoom-meeting-card"
import { ZoomMeetingDialog } from "./zoom-meeting-dialog"
import type { ZoomMeeting } from "@/lib/zoom/types"
import type { UserRole } from "@/lib/types"

interface ZoomMeetingsListProps {
  userId: string
  userRole: UserRole
  classId?: string
  showCreateButton?: boolean
  compact?: boolean
  limit?: number
  title?: string
  basePath?: string
}

export function ZoomMeetingsList({
  userId,
  userRole,
  classId,
  showCreateButton = true,
  compact = false,
  limit,
  title = "Zoom Meetings",
  basePath,
}: ZoomMeetingsListProps) {
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<ZoomMeeting | null>(null)
  const [activeTab, setActiveTab] = useState("upcoming")

  const canCreate = ["teacher", "admin"].includes(userRole)

  const fetchMeetings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (classId) params.set("classId", classId)
      if (activeTab === "upcoming") params.set("upcoming", "true")
      if (activeTab === "past") params.set("status", "ended")
      if (limit) params.set("limit", limit.toString())

      const response = await fetch(`/api/zoom/meetings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMeetings(data.meetings || [])
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error)
    } finally {
      setLoading(false)
    }
  }, [classId, activeTab, limit])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const handleEdit = (meeting: ZoomMeeting) => {
    setEditingMeeting(meeting)
    setShowDialog(true)
  }

  const handleDelete = (meetingId: string) => {
    setMeetings(meetings.filter(m => m.id !== meetingId))
  }

  const handleSuccess = (meeting: ZoomMeeting) => {
    if (editingMeeting) {
      setMeetings(meetings.map(m => m.id === meeting.id ? meeting : m))
    } else {
      setMeetings([meeting, ...meetings])
    }
    setEditingMeeting(null)
  }

  const upcomingMeetings = meetings.filter(m => m.status === "scheduled" || m.status === "started")
  const pastMeetings = meetings.filter(m => m.status === "ended")

  // Compact view for dashboard widgets
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-500" />
              {title}
            </CardTitle>
            {canCreate && showCreateButton && (
              <Button size="sm" variant="outline" onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming meetings</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingMeetings.slice(0, limit || 5).map(meeting => (
                <ZoomMeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  currentUserId={userId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  compact
                />
              ))}
            </div>
          )}
        </CardContent>

        <ZoomMeetingDialog
          open={showDialog}
          onOpenChange={(open) => {
            setShowDialog(open)
            if (!open) setEditingMeeting(null)
          }}
          meeting={editingMeeting}
          onSuccess={handleSuccess}
          defaultClassId={classId}
        />
      </Card>
    )
  }

  // Full view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-500" />
          {title}
        </h2>
        {canCreate && showCreateButton && (
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No upcoming meetings</p>
                {canCreate && (
                  <Button onClick={() => setShowDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingMeetings.map(meeting => (
                <ZoomMeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  currentUserId={userId}
                  userRole={userRole}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  basePath={basePath || (userRole === "admin" ? "/admin/meetings" : "/teacher/meetings")}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pastMeetings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No past meetings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastMeetings.map(meeting => (
                <ZoomMeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  currentUserId={userId}
                  userRole={userRole}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  basePath={basePath || (userRole === "admin" ? "/admin/meetings" : "/teacher/meetings")}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ZoomMeetingDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) setEditingMeeting(null)
        }}
        meeting={editingMeeting}
        onSuccess={handleSuccess}
        defaultClassId={classId}
      />
    </div>
  )
}
