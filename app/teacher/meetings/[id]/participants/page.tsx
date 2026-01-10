"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { 
  ArrowLeft, Users, Clock, CheckCircle2, XCircle, Search, 
  Download, Video, Loader2, BarChart3 
} from "lucide-react"
import { format } from "date-fns"
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

interface MeetingInfo {
  id: string
  title: string
  start_time: string
  status: string
  class?: { id: string; name: string }
}

export default function TeacherMeetingParticipantsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [expectedAttendees, setExpectedAttendees] = useState<ExpectedAttendee[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/zoom/meetings/${id}/participants`)
      if (response.ok) {
        const data = await response.json()
        setMeeting(data.meeting)
        setParticipants(data.participants || [])
        setExpectedAttendees(data.expectedAttendees || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch participants:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    if (mins < 60) return `${mins} min`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const exportToCSV = () => {
    const data = expectedAttendees.length > 0 ? expectedAttendees : participants
    const headers = ["Name", "Email", "Role", "Status", "Join Time", "Leave Time", "Duration"]
    
    const rows = data.map(item => {
      if ("attended" in item) {
        return [
          item.name,
          item.email,
          item.role,
          item.attended ? "Present" : "Absent",
          item.participant?.join_time ? format(new Date(item.participant.join_time), "yyyy-MM-dd HH:mm") : "",
          item.participant?.leave_time ? format(new Date(item.participant.leave_time), "yyyy-MM-dd HH:mm") : "",
          item.participant?.duration ? formatDuration(item.participant.duration) : "",
        ]
      } else {
        return [
          item.user?.name || item.name || "Unknown",
          item.user?.email || item.email || "",
          item.user?.role || "",
          item.status === "joined" || item.status === "left" ? "Present" : "Absent",
          item.join_time ? format(new Date(item.join_time), "yyyy-MM-dd HH:mm") : "",
          item.leave_time ? format(new Date(item.leave_time), "yyyy-MM-dd HH:mm") : "",
          item.duration ? formatDuration(item.duration) : "",
        ]
      }
    })

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meeting-attendance-${id}.csv`
    a.click()
  }

  const filteredAttendees = expectedAttendees.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         a.email.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === "present") return matchesSearch && a.attended
    if (activeTab === "absent") return matchesSearch && !a.attended
    return matchesSearch
  })

  const filteredParticipants = participants.filter(p => {
    const name = p.user?.name || p.name || ""
    const email = p.user?.email || p.email || ""
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           email.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/meetings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="h-6 w-6 text-blue-500" />
              {meeting?.title || "Meeting Participants"}
            </h1>
            <p className="text-muted-foreground">
              {meeting?.start_time && format(new Date(meeting.start_time), "MMMM d, yyyy 'at' h:mm a")}
              {meeting?.class && ` • ${meeting.class.name}`}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.joinedCount}</p>
                  <p className="text-sm text-muted-foreground">Joined</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {stats.expectedCount > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                    <p className="text-sm text-muted-foreground">Attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDuration(stats.avgDurationSeconds)}</p>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDuration(stats.totalDurationSeconds)}</p>
                  <p className="text-sm text-muted-foreground">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {expectedAttendees.length > 0 ? "Class Attendance" : "Participants"}
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {expectedAttendees.length > 0 ? (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList>
                  <TabsTrigger value="all">All ({expectedAttendees.length})</TabsTrigger>
                  <TabsTrigger value="present">Present ({expectedAttendees.filter(a => a.attended).length})</TabsTrigger>
                  <TabsTrigger value="absent">Absent ({expectedAttendees.filter(a => !a.attended).length})</TabsTrigger>
                </TabsList>
              </Tabs>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Time</TableHead>
                    <TableHead>Leave Time</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendees.map(attendee => (
                    <TableRow key={attendee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={attendee.avatar} />
                            <AvatarFallback>{attendee.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{attendee.name}</p>
                            <p className="text-sm text-muted-foreground">{attendee.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {attendee.attended ? (
                          <Badge className="bg-green-500/10 text-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Present
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-500/10 text-red-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            Absent
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {attendee.participant?.join_time 
                          ? format(new Date(attendee.participant.join_time), "h:mm a")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {attendee.participant?.leave_time 
                          ? format(new Date(attendee.participant.leave_time), "h:mm a")
                          : attendee.attended ? "Still in meeting" : "-"}
                      </TableCell>
                      <TableCell>
                        {attendee.participant?.duration 
                          ? formatDuration(attendee.participant.duration)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Join Time</TableHead>
                  <TableHead>Leave Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No participants recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParticipants.map(participant => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.user?.avatar} />
                            <AvatarFallback>
                              {(participant.user?.name || participant.name)?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {participant.user?.name || participant.name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {participant.user?.email || participant.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {participant.user?.role && (
                          <Badge variant="outline" className="capitalize">
                            {participant.user.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {participant.join_time 
                          ? format(new Date(participant.join_time), "h:mm a")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {participant.leave_time 
                          ? format(new Date(participant.leave_time), "h:mm a")
                          : participant.status === "joined" ? "Still in meeting" : "-"}
                      </TableCell>
                      <TableCell>
                        {participant.duration 
                          ? formatDuration(participant.duration)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
