"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, ChevronUp, Users, Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import { formatDistanceStrict, format } from "date-fns"
import Link from "next/link"

interface Participant {
  id: string
  user_id?: string
  name?: string
  email?: string
  join_time?: string
  leave_time?: string
  duration?: number
  status: "invited" | "joined" | "left"
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
}

interface ExpectedAttendee {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  attended: boolean
  participant?: Participant
}

interface Stats {
  totalParticipants: number
  joinedCount: number
  expectedCount: number
  attendanceRate: number
  totalDurationSeconds: number
  avgDurationSeconds: number
}

interface ZoomParticipantsSectionProps {
  meetingId: string
  meetingStatus: string
  compact?: boolean
  basePath?: string // "/admin/meetings" or "/teacher/meetings"
}

export function ZoomParticipantsSection({ 
  meetingId, 
  meetingStatus, 
  compact = false,
  basePath = "/admin/meetings"
}: ZoomParticipantsSectionProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [expectedAttendees, setExpectedAttendees] = useState<ExpectedAttendee[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && participants.length === 0 && !loading) {
      fetchParticipants()
    }
  }, [open])

  const fetchParticipants = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/zoom/meetings/${meetingId}/participants`)
      if (!response.ok) {
        if (response.status === 403) {
          setError("You don't have permission to view participants")
        } else {
          throw new Error("Failed to fetch participants")
        }
        return
      }
      const data = await response.json()
      setParticipants(data.participants || [])
      setExpectedAttendees(data.expectedAttendees || [])
      setStats(data.stats)
    } catch (err) {
      setError("Failed to load participants")
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const joinedParticipants = participants.filter(p => p.status === "joined" || p.status === "left")

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{joinedParticipants.length} joined</span>
        {stats && stats.expectedCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {stats.attendanceRate}% attendance
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3 pt-3 border-t">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between px-2 h-8">
          <span className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Participants
            {joinedParticipants.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {joinedParticipants.length}
              </Badge>
            )}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground text-center py-2">{error}</p>
        ) : (
          <div className="space-y-3">
            {/* Stats summary */}
            {stats && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2 border-b">
                <span>{stats.joinedCount} joined</span>
                {stats.expectedCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{stats.attendanceRate}% attendance</span>
                  </>
                )}
                {stats.avgDurationSeconds > 0 && (
                  <>
                    <span>•</span>
                    <span>Avg: {formatDuration(stats.avgDurationSeconds)}</span>
                  </>
                )}
              </div>
            )}

            {/* Expected attendees (if class-linked) */}
            {expectedAttendees.length > 0 ? (
              <div className="space-y-2">
                {expectedAttendees.map(attendee => (
                  <div key={attendee.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={attendee.avatar} />
                      <AvatarFallback className="text-xs">
                        {attendee.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attendee.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{attendee.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {attendee.attended ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {attendee.participant?.duration && (
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(attendee.participant.duration)}
                            </span>
                          )}
                        </>
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : joinedParticipants.length > 0 ? (
              <div className="space-y-2">
                {joinedParticipants.map(participant => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.user?.avatar} />
                      <AvatarFallback className="text-xs">
                        {(participant.user?.name || participant.name)?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {participant.user?.name || participant.name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {participant.join_time && (
                          <span>Joined {format(new Date(participant.join_time), "h:mm a")}</span>
                        )}
                        {participant.duration && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(participant.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {participant.user?.role && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {participant.user.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                {meetingStatus === "scheduled" ? "No one has joined yet" : "No participants recorded"}
              </p>
            )}

            {/* Link to full page */}
            {(joinedParticipants.length > 0 || expectedAttendees.length > 0) && (
              <Link href={`${basePath}/${meetingId}/participants`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Report
                </Button>
              </Link>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
