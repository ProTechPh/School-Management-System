"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, Clock } from "lucide-react"

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  partial: number
  late: number
}

interface AttendanceRecord {
  student_id: string
  status: string
  student: {
    id: string
    name: string
    email: string
  }
}

interface MeetingAttendanceSummaryProps {
  meetingId: string
  classId?: string
}

export function MeetingAttendanceSummary({ meetingId, classId }: MeetingAttendanceSummaryProps) {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!classId) {
      setLoading(false)
      return
    }

    async function fetchAttendance() {
      try {
        const res = await fetch(`/api/zoom/meetings/${meetingId}/attendance`)
        if (res.ok) {
          const data = await res.json()
          setSummary(data.summary)
          setRecords(data.records || [])
        }
      } catch (error) {
        console.error("Error fetching attendance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [meetingId, classId])

  if (!classId) {
    return null // No attendance for non-class meetings
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Attendance will be recorded when the meeting ends.
          </p>
        </CardContent>
      </Card>
    )
  }

  const presentRate = summary.total > 0 
    ? Math.round((summary.present / summary.total) * 100) 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Attendance Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <UserCheck className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <div className="text-2xl font-bold text-green-600">{summary.present}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <UserX className="h-5 w-5 mx-auto text-red-600 mb-1" />
            <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <Clock className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
            <div className="text-2xl font-bold text-yellow-600">{summary.partial}</div>
            <div className="text-xs text-muted-foreground">Partial (&lt;15min)</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <div className="text-2xl font-bold text-blue-600">{presentRate}%</div>
            <div className="text-xs text-muted-foreground">Attendance Rate</div>
          </div>
        </div>

        {/* Student List */}
        {records.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Student Attendance</h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {records.map((record) => (
                <div 
                  key={record.student_id} 
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded"
                >
                  <span className="text-sm">{record.student?.name || "Unknown"}</span>
                  <Badge variant={getStatusVariant(record.status)}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "present":
      return "default"
    case "absent":
      return "destructive"
    case "partial":
    case "late":
      return "secondary"
    default:
      return "outline"
  }
}
