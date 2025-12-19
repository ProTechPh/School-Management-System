"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AttendanceRecord {
  id: string
  class_name: string
  date: string
  status: "present" | "absent" | "late" | "excused"
}

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
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

    const { data } = await supabase
      .from("attendance_records")
      .select(`
        id, date, status,
        class:classes (name)
      `)
      .eq("student_id", user.id)
      .order("date", { ascending: false })

    if (data) {
      setRecords(data.map(r => ({
        id: r.id,
        class_name: (r.class as any)?.name || "Unknown",
        date: r.date,
        status: r.status,
      })))
    }

    setLoading(false)
  }

  const stats = {
    total: records.length,
    present: records.filter((a) => a.status === "present").length,
    absent: records.filter((a) => a.status === "absent").length,
    late: records.filter((a) => a.status === "late").length,
    excused: records.filter((a) => a.status === "excused").length,
  }

  const attendanceRate = stats.total ? Math.round((stats.present / stats.total) * 100) : 100

  const statusColors = {
    present: "default" as const,
    absent: "destructive" as const,
    late: "secondary" as const,
    excused: "outline" as const,
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="My Attendance" subtitle="View your attendance records" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Attendance" subtitle="View your attendance records" userId={userId} />
      <div className="p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <Card className="bg-card md:col-span-2">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <div className="mt-2 flex items-center gap-4">
                <p className="text-3xl font-bold text-primary">{attendanceRate}%</p>
                <Progress value={attendanceRate} className="flex-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-2xl font-bold text-primary">{stats.present}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Late</p>
              <p className="text-2xl font-bold text-muted-foreground">{stats.late}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length > 0 ? (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div>
                      <p className="font-medium text-card-foreground">{record.class_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={statusColors[record.status]} className="capitalize">{record.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No attendance records found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
