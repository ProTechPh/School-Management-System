"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, TrendingUp, Calendar, BookOpen, Loader2 } from "lucide-react"
import { useParentStore } from "@/lib/parent-store"
import { useAnalyticsStore } from "@/lib/analytics-store"
import { students } from "@/lib/mock-data"

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true)
  const [selectedChildId, setSelectedChildId] = useState("")
  
  const { getChildrenIds, getParent } = useParentStore()
  const { getStudentAnalytics, getAttendanceStats } = useAnalyticsStore()

  // Mock parent ID - in production this would come from auth
  const parentId = "p1"
  const parent = getParent(parentId)
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

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Parent Dashboard" subtitle="Loading..." />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Parent Dashboard"
        subtitle={`Welcome, ${parent?.name || "Parent"}`}
      />
      <div className="p-4 lg:p-6">
        {/* Child Selector */}
        {childrenIds.length > 1 && (
          <div className="mb-6">
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
          </div>
        )}

        {selectedChild && (
          <>
            {/* Child Info Card */}
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedChild.avatar} alt={selectedChild.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {selectedChild.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-card-foreground">{selectedChild.name}</h2>
                    <p className="text-muted-foreground">
                      Grade {selectedChild.grade} - Section {selectedChild.section}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedChild.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Overall Average"
                value={`${childAnalytics?.overallAverage || 0}%`}
                icon={TrendingUp}
              />
              <StatCard
                title="Attendance Rate"
                value={`${attendanceStats?.rate || 0}%`}
                icon={Calendar}
              />
              <StatCard
                title="Subjects"
                value={childAnalytics?.subjectPerformance.length || 0}
                icon={BookOpen}
              />
              <StatCard
                title="Improvement"
                value={`${childAnalytics?.improvementRate || 0 > 0 ? "+" : ""}${childAnalytics?.improvementRate || 0}%`}
                icon={Users}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Subject Performance */}
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Subject Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {childAnalytics?.subjectPerformance.length ? (
                    <div className="space-y-4">
                      {childAnalytics.subjectPerformance.map((subject) => (
                        <div key={subject.subject}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{subject.subject}</span>
                            <Badge variant={subject.average >= 90 ? "default" : subject.average >= 75 ? "secondary" : "destructive"}>
                              {subject.average}%
                            </Badge>
                          </div>
                          <Progress value={subject.average} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Low: {subject.lowest}</span>
                            <span>High: {subject.highest}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No grade data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {attendanceStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-green-500/10 p-4 text-center">
                          <p className="text-2xl font-bold text-green-500">{attendanceStats.present}</p>
                          <p className="text-sm text-muted-foreground">Present</p>
                        </div>
                        <div className="rounded-lg bg-amber-500/10 p-4 text-center">
                          <p className="text-2xl font-bold text-amber-500">{attendanceStats.late}</p>
                          <p className="text-sm text-muted-foreground">Late</p>
                        </div>
                        <div className="rounded-lg bg-red-500/10 p-4 text-center">
                          <p className="text-2xl font-bold text-red-500">{attendanceStats.absent}</p>
                          <p className="text-sm text-muted-foreground">Absent</p>
                        </div>
                        <div className="rounded-lg bg-blue-500/10 p-4 text-center">
                          <p className="text-2xl font-bold text-blue-500">{attendanceStats.excused}</p>
                          <p className="text-sm text-muted-foreground">Excused</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Overall Attendance Rate</span>
                          <span className="text-xl font-bold">{attendanceStats.rate}%</span>
                        </div>
                        <Progress value={attendanceStats.rate} className="mt-2" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No attendance data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Grades */}
              <Card className="bg-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Recent Grades</CardTitle>
                </CardHeader>
                <CardContent>
                  {childAnalytics?.gradeTrends.length ? (
                    <div className="space-y-3">
                      {childAnalytics.gradeTrends.slice(-5).reverse().map((grade, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <p className="font-medium">{grade.subject}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {grade.type} • {new Date(grade.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={grade.grade >= 90 ? "default" : grade.grade >= 75 ? "secondary" : "destructive"}>
                            {grade.grade}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent grades
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!selectedChild && (
          <Card className="bg-card">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No children linked to this account.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
