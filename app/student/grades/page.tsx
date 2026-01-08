"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calculator, TrendingUp, Award, AlertTriangle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getGradeInfo,
  getGradeColorVariant,
  calculateFinalGrade,
  defaultWeights,
} from "@/lib/grade-utils"
import { isSafeKey } from "@/lib/utils"

interface Grade {
  id: string
  class_id: string
  class_name: string
  type: "exam" | "quiz" | "assignment" | "project"
  score: number
  max_score: number
  percentage: number
  grade: number
  date: string
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([])
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

    try {
      // Use secure API route instead of direct DB query
      const response = await fetch("/api/student/grades")
      if (!response.ok) throw new Error("Failed to fetch grades")
      
      const { grades: data } = await response.json()

      if (data) {
        setGrades(data.map((g: any) => ({
          id: g.id,
          class_id: g.class_id,
          class_name: g.class?.name || "Unknown",
          type: g.type,
          score: g.score,
          max_score: g.max_score,
          percentage: g.percentage,
          grade: g.grade,
          date: g.date,
        })))
      }
    } catch (error) {
      console.error("Error fetching grades:", error)
    } finally {
      setLoading(false)
    }
  }

  const overallAssessments = grades.map((g) => ({ type: g.type, percentage: g.percentage }))
  const overallFinalGrade = calculateFinalGrade(overallAssessments)
  const overallGradeInfo = getGradeInfo(overallFinalGrade)

  const gradesByClass = grades.reduce((acc, grade) => {
    if (!acc[grade.class_id]) acc[grade.class_id] = []
    acc[grade.class_id].push(grade)
    return acc
  }, {} as Record<string, Grade[]>)

  const typeBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; total: number; avg: number }> = {}
    grades.forEach((g) => {
      // SECURITY FIX: Validate key to prevent prototype pollution
      if (!isSafeKey(g.type)) return
      if (!breakdown[g.type]) breakdown[g.type] = { count: 0, total: 0, avg: 0 }
      breakdown[g.type].count++
      breakdown[g.type].total += g.percentage
    })
    Object.keys(breakdown).forEach((type) => {
      if (!isSafeKey(type)) return
      breakdown[type].avg = Math.round(breakdown[type].total / breakdown[type].count)
    })
    return breakdown
  }, [grades])

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="My Grades" subtitle="View your academic performance" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Grades" subtitle="View your academic performance (Philippine Grading System)" userId={userId} />
      <div className="p-4 lg:p-6">
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Final Grade</p>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-bold text-card-foreground">{overallFinalGrade}</span>
                  <div>
                    <Badge variant={getGradeColorVariant(overallGradeInfo.status)} className="text-sm">{overallGradeInfo.remarks}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{overallFinalGrade >= 75 ? "Passing" : "Needs Improvement"}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-6">
                {defaultWeights.map((w) => {
                  const data = typeBreakdown[w.type]
                  return (
                    <div key={w.type} className="text-center">
                      <p className="text-xs text-muted-foreground capitalize">{w.type}</p>
                      <p className="text-lg font-bold">{data ? `${data.avg}%` : "-"}</p>
                      <p className="text-xs text-muted-foreground">({w.weight}% weight)</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <Progress value={overallFinalGrade} className="h-2 mt-4" />
          </CardContent>
        </Card>

        <Card className="mb-6 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />Philippine Grading Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="default">96-100: Excellent</Badge>
              <Badge variant="default">90-95: Outstanding</Badge>
              <Badge variant="secondary">85-89: Very Satisfactory</Badge>
              <Badge variant="secondary">80-84: Satisfactory</Badge>
              <Badge variant="outline">75-79: Fairly Satisfactory</Badge>
              <Badge variant="destructive">Below 75: Did Not Meet Expectations</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assessments</p>
                <p className="text-2xl font-bold text-card-foreground">{grades.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highest Grade</p>
                <p className="text-2xl font-bold text-card-foreground">{grades.length ? Math.max(...grades.map((g) => g.grade)) : 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grades 90+</p>
                <p className="text-2xl font-bold text-card-foreground">{grades.filter((g) => g.grade >= 90).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Below 75</p>
                <p className="text-2xl font-bold text-card-foreground">{grades.filter((g) => g.grade < 75).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {Object.entries(gradesByClass).map(([classId, classGrades]) => {
            const className = classGrades[0]?.class_name || "Unknown Class"
            const classAssessments = classGrades.map((g) => ({ type: g.type, percentage: g.percentage }))
            const classFinalGrade = calculateFinalGrade(classAssessments)
            const classGradeInfo = getGradeInfo(classFinalGrade)

            return (
              <Card key={classId} className="bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{className}</CardTitle>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Class Grade</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{classFinalGrade}</span>
                        <Badge variant={getGradeColorVariant(classGradeInfo.status)}>{classGradeInfo.remarks}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {classGrades.map((grade) => {
                      const info = getGradeInfo(grade.grade)
                      return (
                        <div key={grade.id} className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium text-card-foreground capitalize">{grade.type}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={getGradeColorVariant(info.status)}>{grade.grade}</Badge>
                                <span className="text-xs text-muted-foreground">{info.remarks}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress value={grade.grade} className="flex-1" />
                              <span className="text-sm text-muted-foreground min-w-[80px] text-right">{grade.score}/{grade.max_score} ({grade.percentage}%)</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{new Date(grade.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {grades.length === 0 && (
          <Card className="bg-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No grades recorded yet. Check back after your first assessments.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}