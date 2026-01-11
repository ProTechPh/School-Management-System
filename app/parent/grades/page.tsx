"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useParentStore } from "@/lib/parent-store"
import { useAnalyticsStore } from "@/lib/analytics-store"
import { students } from "@/lib/mock-data"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function ParentGradesPage() {
  const [loading, setLoading] = useState(true)
  const [selectedChildId, setSelectedChildId] = useState("")

  const { getChildrenIds } = useParentStore()
  const { getStudentAnalytics } = useAnalyticsStore()

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

  const gradeTrendData = childAnalytics?.gradeTrends.map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    grade: t.grade,
    subject: t.subject,
    type: t.type,
  })) || []

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Grades" subtitle="View your child's academic performance" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Grades"
        subtitle="View your child's academic performance"
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

        {selectedChild && childAnalytics && (
          <>
            {/* Overall Summary */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{selectedChild.name}&apos;s Overall Average</p>
                    <div className="flex items-center gap-3">
                      <span className="text-5xl font-bold">{childAnalytics.overallAverage}%</span>
                      <div className="flex items-center gap-1">
                        {childAnalytics.improvementRate > 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : childAnalytics.improvementRate < 0 ? (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        ) : (
                          <Minus className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className={childAnalytics.improvementRate >= 0 ? "text-green-500" : "text-red-500"}>
                          {childAnalytics.improvementRate > 0 ? "+" : ""}{childAnalytics.improvementRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    {childAnalytics.subjectPerformance.map((s) => (
                      <div key={s.subject} className="text-center">
                        <p className="text-xs text-muted-foreground">{s.subject}</p>
                        <p className="text-lg font-bold">{s.average}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grade Trend Chart */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Grade Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gradeTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis domain={[60, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number | undefined, _name: string, props: any) => [
                          `${value ?? 0}%`,
                          `${props.payload.subject} (${props.payload.type})`
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="grade"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Subject Breakdown */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {childAnalytics.subjectPerformance.map((subject) => (
                    <div key={subject.subject} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{subject.subject}</h4>
                        <Badge variant={subject.average >= 90 ? "default" : subject.average >= 75 ? "secondary" : "destructive"}>
                          {subject.average}%
                        </Badge>
                      </div>
                      <Progress value={subject.average} className="h-2 mb-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Lowest: {subject.lowest}%</span>
                        <span>{subject.count} assessments</span>
                        <span>Highest: {subject.highest}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Recent Grades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {childAnalytics.gradeTrends.slice(-10).reverse().map((grade, idx) => (
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
