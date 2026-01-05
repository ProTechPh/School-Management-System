"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Award, Target, Calendar, BookOpen, Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"

interface ProgressAnalyticsProps {
  studentId: string
  studentName?: string
  showDetailed?: boolean
}

interface GradeTrend { date: string; grade: number; subject: string; type: string }
interface AttendanceTrend { date: string; status: string }
interface SubjectPerformance { subject: string; average: number; highest: number; lowest: number; count: number }

export function ProgressAnalytics({ studentId, studentName, showDetailed = true }: ProgressAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [gradeTrends, setGradeTrends] = useState<GradeTrend[]>([])
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([])
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([])
  const [overallAverage, setOverallAverage] = useState(0)
  const [attendanceRate, setAttendanceRate] = useState(0)
  const [improvementRate, setImprovementRate] = useState(0)

  useEffect(() => {
    if (studentId) fetchAnalytics()
  }, [studentId])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/student/${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setGradeTrends(data.gradeTrends || [])
        setAttendanceTrends(data.attendanceTrends || [])
        setSubjectPerformance(data.subjectPerformance || [])
        setOverallAverage(data.overallAverage || 0)
        setAttendanceRate(data.attendanceRate || 0)
        setImprovementRate(data.improvementRate || 0)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const gradeTrendData = gradeTrends.map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    grade: t.grade,
    subject: t.subject,
  }))

  const subjectData = subjectPerformance.map((s) => ({
    name: s.subject,
    average: s.average,
    highest: s.highest,
    lowest: s.lowest,
  }))

  const attendanceStats = {
    present: attendanceTrends.filter((t) => t.status === "present").length,
    late: attendanceTrends.filter((t) => t.status === "late").length,
    absent: attendanceTrends.filter((t) => t.status === "absent").length,
    excused: attendanceTrends.filter((t) => t.status === "excused").length,
  }

  const attendancePieData = [
    { name: "Present", value: attendanceStats.present, color: "#10b981" },
    { name: "Late", value: attendanceStats.late, color: "#f59e0b" },
    { name: "Absent", value: attendanceStats.absent, color: "#ef4444" },
    { name: "Excused", value: attendanceStats.excused, color: "#6366f1" },
  ].filter((d) => d.value > 0)

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (gradeTrends.length === 0 && attendanceTrends.length === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No analytics data available for this student.</p>
        </CardContent>
      </Card>
    )
  }

  const TrendIcon = improvementRate > 0 ? TrendingUp : improvementRate < 0 ? TrendingDown : Minus
  const trendColor = improvementRate > 0 ? "text-green-500" : improvementRate < 0 ? "text-red-500" : "text-muted-foreground"

  return (
    <div className="space-y-6">
      {studentName && <h2 className="text-xl font-semibold">{studentName}&apos;s Progress</h2>}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Target className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Overall Average</p><p className="text-2xl font-bold">{overallAverage}%</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center"><Calendar className="h-5 w-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Attendance Rate</p><p className="text-2xl font-bold">{attendanceRate}%</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-full ${improvementRate >= 0 ? "bg-green-500/10" : "bg-red-500/10"} flex items-center justify-center`}><TrendIcon className={`h-5 w-5 ${trendColor}`} /></div><div><p className="text-sm text-muted-foreground">Improvement</p><p className={`text-2xl font-bold ${trendColor}`}>{improvementRate > 0 ? "+" : ""}{improvementRate}%</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center"><BookOpen className="h-5 w-5 text-purple-500" /></div><div><p className="text-sm text-muted-foreground">Subjects</p><p className="text-2xl font-bold">{subjectPerformance.length}</p></div></div></CardContent></Card>
      </div>

      {showDetailed && (
        <>
          {gradeTrendData.length > 0 && (
            <Card className="bg-card">
              <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4" />Grade Trends Over Time</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gradeTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[60, 100]} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} labelStyle={{ color: "hsl(var(--card-foreground))" }} />
                      <Line type="monotone" dataKey="grade" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {subjectData.length > 0 && (
              <Card className="bg-card">
                <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Award className="h-4 w-4" />Performance by Subject</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Bar dataKey="average" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {subjectData.map((subject) => (
                      <div key={subject.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{subject.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">Low: {subject.lowest}</span>
                          <span className="font-medium">{subject.average}%</span>
                          <span className="text-xs text-muted-foreground">High: {subject.highest}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {attendancePieData.length > 0 && (
              <Card className="bg-card">
                <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Attendance Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                          {attendancePieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {attendancePieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
