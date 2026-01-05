"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { useParentStore } from "@/lib/parent-store"
import { useAnalyticsStore } from "@/lib/analytics-store"
import { students } from "@/lib/mock-data"

export default function ParentAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [selectedChildId, setSelectedChildId] = useState("")

  const { getChildrenIds } = useParentStore()
  const { getStudentAnalytics, getAttendanceStats } = useAnalyticsStore()

  const parentId = "p1"
  const childrenIds = getChildrenIds(parentId)

  useEffect(() => {
    if (childrenIds.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenIds[0])
    }
    setLoading(false)
  }, [childrenIds, selectedChildId])

  const selectedChild = students.find((s) => s.id === selectedChildId)
  const childAnalytics = selectedChildId ? getStudentAnalytics(selectedChildId) : null
  const attendanceStats = selectedChildId ? getAttendanceStats(selectedChildId) : null

  const statusConfig = {
    present: { label: "Present", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
    absent: { label: "Absent", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    late: { label: "Late", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    excused: { label: "Excused", icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Attendance" subtitle="View your child's attendance records" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Attendance"
        subtitle="View your child's attendance records"
      />
      <div className="p-4 lg:p-6 space-y-6">
        {childrenIds.length > 1 && (
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {childrenIds.map((childId) => {
                const child = students.find((s) => s.id === childId)
                return (
                  <SelectItem key={childId} value={childId}>
                    {child?.name || childId}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}

        {selectedChild && attendanceStats && (
          <>
            {/* Attendance Summary */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{selectedChild.name}&apos;s Attendance Rate</p>
                    <span className="text-5xl font-bold">{attendanceStats.rate}%</span>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Present</p>
                      <p className="text-lg font-bold text-green-500">{attendanceStats.present}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Late</p>
                      <p className="text-lg font-bold text-amber-500">{attendanceStats.late}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Absent</p>
                      <p className="text-lg font-bold text-red-500">{attendanceStats.absent}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Excused</p>
                      <p className="text-lg font-bold text-blue-500">{attendanceStats.excused}</p>
                    </div>
                  </div>
                </div>
                <Progress value={attendanceStats.rate} className="h-2 mt-4" />
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = attendanceStats[status as keyof typeof attendanceStats] as number
                const Icon = config.icon
                return (
                  <Card key={status} className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${config.bg} flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{config.label}</p>
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Attendance Records */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Recent Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                {childAnalytics?.attendanceTrends.length ? (
                  <div className="space-y-3">
                    {childAnalytics.attendanceTrends.slice(-15).reverse().map((record, idx) => {
                      const config = statusConfig[record.status]
                      const Icon = config.icon
                      return (
                        <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center`}>
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div>
                              <p className="font-medium">{new Date(record.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
                            </div>
                          </div>
                          <Badge variant={record.status === "present" ? "default" : record.status === "absent" ? "destructive" : "secondary"}>
                            {config.label}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No attendance records available
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
