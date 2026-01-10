"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Video, Clock, Users, MoreVertical, Edit, Trash2, ExternalLink, Copy, Loader2 } from "lucide-react"
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns"
import { toast } from "sonner"
import type { ZoomMeeting } from "@/lib/zoom/types"
import { ZoomParticipantsSection } from "./zoom-participants-section"

interface ZoomMeetingCardProps {
  meeting: ZoomMeeting
  currentUserId: string
  userRole?: string
  onEdit?: (meeting: ZoomMeeting) => void
  onDelete?: (meetingId: string) => void
  onJoin?: (meeting: ZoomMeeting) => void
  compact?: boolean
  showParticipants?: boolean
  basePath?: string
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-500",
  started: "bg-green-500/10 text-green-500",
  ended: "bg-gray-500/10 text-gray-500",
  cancelled: "bg-red-500/10 text-red-500",
}

export function ZoomMeetingCard({
  meeting,
  currentUserId,
  userRole,
  onEdit,
  onDelete,
  onJoin,
  compact = false,
  showParticipants = true,
  basePath = "/admin/meetings",
}: ZoomMeetingCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [joining, setJoining] = useState(false)

  const isHost = meeting.host_id === currentUserId
  const startTime = new Date(meeting.start_time)
  const endTime = new Date(startTime.getTime() + meeting.duration * 60000)
  const isUpcoming = isFuture(startTime)
  const isLive = meeting.status === "started" || (!isPast(endTime) && isPast(startTime))
  const canJoin = meeting.status !== "cancelled" && meeting.status !== "ended"

  const handleJoin = async () => {
    setJoining(true)
    try {
      const response = await fetch(`/api/zoom/meetings/${meeting.id}/join`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to get join info")
      }

      const joinInfo = await response.json()
      
      // If custom join handler provided, use it
      if (onJoin) {
        onJoin(meeting)
        return
      }

      // Otherwise open in new tab
      const url = isHost && joinInfo.startUrl ? joinInfo.startUrl : joinInfo.joinUrl
      window.open(url, "_blank")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join meeting")
    } finally {
      setJoining(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/zoom/meetings/${meeting.id}`, { method: "DELETE" })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete meeting")
      }
      toast.success("Meeting deleted")
      onDelete?.(meeting.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete meeting")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const copyJoinLink = () => {
    navigator.clipboard.writeText(meeting.join_url)
    toast.success("Join link copied to clipboard")
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-full ${isLive ? "bg-green-500/10" : "bg-blue-500/10"}`}>
            <Video className={`h-4 w-4 ${isLive ? "text-green-500" : "text-blue-500"}`} />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{meeting.title}</p>
            <p className="text-xs text-muted-foreground">
              {isLive ? "Live now" : format(startTime, "MMM d, h:mm a")}
            </p>
          </div>
        </div>
        {canJoin && (
          <Button size="sm" variant={isLive ? "default" : "outline"} onClick={handleJoin} disabled={joining}>
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={`p-2.5 rounded-lg ${isLive ? "bg-green-500/10" : "bg-blue-500/10"}`}>
                <Video className={`h-5 w-5 ${isLive ? "text-green-500" : "text-blue-500"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{meeting.title}</h3>
                  <Badge variant="secondary" className={statusColors[meeting.status]}>
                    {isLive ? "Live" : meeting.status}
                  </Badge>
                </div>
                
                {meeting.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{meeting.description}</p>
                )}

                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>
                      {isUpcoming
                        ? `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`
                        : format(startTime, "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{meeting.duration} min</span>
                  </div>
                </div>

                {meeting.class && (
                  <Badge variant="outline" className="mt-2">{meeting.class.name}</Badge>
                )}

                {meeting.host && (
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={meeting.host.avatar} />
                      <AvatarFallback className="text-xs">
                        {meeting.host.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {isHost ? "You" : meeting.host.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canJoin && (
                <Button onClick={handleJoin} disabled={joining} variant={isLive ? "default" : "outline"}>
                  {joining ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  {isHost ? "Start" : "Join"}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyJoinLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy join link
                  </DropdownMenuItem>
                  {isHost && meeting.status === "scheduled" && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit?.(meeting)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit meeting
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete meeting
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Participants Section */}
          {showParticipants && (isHost || userRole === "admin" || userRole === "teacher") && (
            <ZoomParticipantsSection 
              meetingId={meeting.id} 
              meetingStatus={meeting.status}
              basePath={basePath}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{meeting.title}"? This will also remove it from Zoom and notify participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
