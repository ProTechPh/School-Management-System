"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Calculator, Users, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import {
  getGradeInfo,
  getGradeColorVariant,
  calculateFinalGrade,
  defaultWeights,
} from "@/lib/grade-utils"

interface Grade {
  id: string
  student_id: string
  student_name: string
  class_id: string
  class_name: string
  subject: string
  score: number
  max_score: number
  percentage: number
  grade: number
  type: "exam" | "quiz" | "assignment" | "project"
  date: string
}

interface Student {
  id: string
  name: string
  grade: string
  section: string
}

interface ClassInfo {
  id: string
  name: string
}

export default function AdminGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterClass, setFilterClass] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStudent, setFilterStudent] = useState<string>("all")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    // Fetch grades securely
    try {
      const response = await fetch("/api/admin/grades")
      if (response.ok) {
        const { grades: gradeData } = await response.json()
        setGrades(gradeData.map((g: any) => ({
          id: g.id,
          student_id: g.student_id,
          student_name: g.student?.name || "Unknown",
          class_id: g.class_id,
          class_name: g.class?.name || "Unknown",
          subject: g.class?.subject || "Unknown",
          score: g.score,
          max_score: g.max_score,
          percentage: g.percentage,
          grade: g.grade,
          type: g.type,
          date: g.date,
        })))
      }
    } catch (error) {
      console.error("Failed to fetch grades", error)
    }

    // Fetch students (can still use client-side if public, but better to secure later)
    const { data: studentData } = await supabase
      .from("users")
      .select(`id, name, student_profiles (grade, section)`)
      .eq("role", "student")
      .order("name")

    if (studentData) {
      setStudents(studentData.map(s => ({
        id: s.id,
        name: s.name,
        grade: (s.student_profiles as any)?.[0]?.grade || "N/A",
        section: (s.student_profiles as any)?.[0]?.section || "N/A",
      })))
    }

    // Fetch classes
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name")
      .order("name")

    if (classData) setClasses(classData)

    setLoading(false)
  }

  const filteredGrades = grades.filter((grade) => {
    const matchesSearch =
      grade.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = filterClass === "all" || grade.class_id === filterClass
    const matchesType = filterType === "all" || grade.type === filterType
    const matchesStudent = filterStudent === "all" || grade.student_id === filterStudent
    return matchesSearch && matchesClass && matchesType && matchesStudent
  })

  const studentSummaries = useMemo(() => {
    const summaries: Record<string, {
      student: Student
      grades: Grade[]
      finalGrade: number
      gradeInfo: ReturnType<typeof getGradeInfo>
      byType: Record<string, { count: number; avg: number }>
    }> = {}

    students.forEach((student) => {
      const studentGrades = grades.filter((g) => g.student_id === student.id)
      if (studentGrades.length === 0) return

      const assessments = studentGrades.map((g) => ({
        type: g.type,
        percentage: g.percentage,
      }))

      const finalGrade = calculateFinalGrade(assessments)
      const gradeInfo = getGradeInfo(finalGrade)

      const byType: Record<string, { count: number; avg: number }> = {}
      const typeGroups: Record<string, number[]> = {}

      studentGrades.forEach((g) => {
        if (!typeGroups[g.type]) typeGroups[g.type] = []
        typeGroups[g.type].push(g.percentage)
      })

      Object.entries(typeGroups).forEach(([type, percentages]) => {
        byType[type] = {
          count: percentages.length,
          avg: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
        }
      })

      summaries[student.id] = { student, grades: studentGrades, finalGrade, gradeInfo, byType }
    })

    return summaries
  }, [grades, students])

  const columns = [
    {
      key: "studentName",
      header: "Student",
      render: (grade: Grade) => <span className="font-medium text-card-foreground">{grade.student_name}</span>,
    },
    {
      key: "className",
      header: "Class",
      render: (grade: Grade) => <span className="text-sm text-muted-foreground">{grade.class_name}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (grade: Grade) => (
        <Badge variant="outline" className="capitalize">{grade.type}</Badge>
      ),
    },
    {
      key: "score",
      header: "Score",
      render: (grade: Grade) => (
        <span className="font-medium text-card-foreground">
          {grade.score}/{grade.max_score} ({grade.percentage}%)
        </span>
      ),
    },
    {
      key: "grade",
      header: "Grade",
      render: (grade: Grade) => {
        const info = getGradeInfo(grade.grade)
        return (
          <div className="flex items-center gap-2">
            <Badge variant={getGradeColorVariant(info.status)}>{grade.grade}</Badge>
            <span className="text-xs text-muted-foreground">{info.remarks}</span>
          </div>
        )
      },
    },
    {
      key: "date",
      header: "Date",
      render: (grade: Grade) => (
        <span className="text-sm text-muted-foreground">{new Date(grade.date).toLocaleDateString()}</span>
      ),
    },
  ]

  const avgGrade = filteredGrades.length
    ? Math.round(filteredGrades.reduce((sum, g) => sum + g.grade, 0) / filteredGrades.length)
    : 0
  const passingCount = filteredGrades.filter((g) => g.grade >= 75).length
  const failingCount = filteredGrades.filter((g) => g.grade < 75).length

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Grade Management" subtitle="View student grades" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Grade Management" subtitle="View student grades and computed final grades (Philippine Grading System)" userId={userId} />
      <div className="p-4 lg:p-6">
        <Card className="mb-6 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Philippine Grading Scale Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">96-100: Excellent</Badge>
              <Badge variant="default">90-95: Outstanding</Badge>
              <Badge variant="secondary">85-89: Very Satisfactory</Badge>
              <Badge variant="secondary">80-84: Satisfactory</Badge>
              <Badge variant="outline">75-79: Fairly Satisfactory</Badge>
              <Badge variant="destructive">Below 75: Did Not Meet Expectations</Badge>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <strong>Weight Distribution:</strong> Quiz (30%) • Exam (35%) • Assignment (20%) • Project (15%)
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all-grades" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all-grades">All Grades</TabsTrigger>
            <TabsTrigger value="student-summary">Student Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="all-grades" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-card">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold text-card-foreground">{filteredGrades.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Average Grade</p>
                  <p className="text-2xl font-bold text-primary">{avgGrade}</p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Passing (75+)</p>
                  <p className="text-2xl font-bold text-green-500">{passingCount}</p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Below 75</p>
                  <p className="text-2xl font-bold text-destructive">{failingCount}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by student or subject..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable columns={columns} data={filteredGrades} />
          </TabsContent>

          <TabsContent value="student-summary" className="space-y-4">
            <div className="grid gap-4">
              {Object.values(studentSummaries).map(({ student, grades, finalGrade, gradeInfo, byType }) => (
                <Card key={student.id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Grade {student.grade}-{student.section} • {grades.length} assessments
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex gap-3">
                          {defaultWeights.map((w) => {
                            const typeData = byType[w.type]
                            return (
                              <div key={w.type} className="text-center">
                                <p className="text-xs text-muted-foreground capitalize">{w.type}</p>
                                <p className="text-sm font-medium">{typeData ? `${typeData.avg}%` : "-"}</p>
                                <p className="text-xs text-muted-foreground">{w.weight}%</p>
                              </div>
                            )
                          })}
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-border">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Final Grade</p>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-card-foreground">{finalGrade}</span>
                              <Badge variant={getGradeColorVariant(gradeInfo.status)}>{gradeInfo.remarks}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Grade Progress</span>
                        <span>{finalGrade}/100</span>
                      </div>
                      <Progress value={finalGrade} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {Object.keys(studentSummaries).length === 0 && (
                <Card className="bg-card">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No grade data available yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}