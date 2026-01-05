"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProgressAnalytics } from "@/components/progress-analytics"
import { Loader2, Users, TrendingUp, Award, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ClassData {
  id: string
  name: string
}

interface StudentData {
  id: string
  name: string
}

export default function TeacherAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [classes, setClasses] = useState<ClassData[]>([])
  const [students, setStudents] = useState<StudentData[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass)
    }
  }, [selectedClass])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    try {
      const response = await fetch("/api/teacher/my-classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
        if (data.classes.length > 0) {
          setSelectedClass(data.classes[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassStudents = async (classId: string) => {
    try {
      const response = await fetch(`/api/teacher/grades/class/${classId}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
        setSelectedStudent("")
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  // Mock class performance data
  const classPerformanceData = [
    { name: "Excellent (90+)", count: 5, fill: "#10b981" },
    { name: "Good (80-89)", count: 8, fill: "#3b82f6" },
    { name: "Satisfactory (75-79)", count: 4, fill: "#f59e0b" },
    { name: "Needs Improvement (<75)", count: 2, fill: "#ef4444" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Class Analytics" subtitle="View student performance analytics" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Class Analytics"
        subtitle="View and analyze student performance"
        userId={userId}
      />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {students.length > 0 && (
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a student (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {!selectedStudent || selectedStudent === "all" ? (
          <>
            {/* Class Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{students.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Class Average</p>
                      <p className="text-2xl font-bold">85%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Top Performers</p>
                      <p className="text-2xl font-bold">5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Need Attention</p>
                      <p className="text-2xl font-bold">2</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Class Performance Distribution */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Student List */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Student Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student.id)}
                      className="w-full flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="font-medium">{student.name}</span>
                      <span className="text-sm text-muted-foreground">View Details →</span>
                    </button>
                  ))}
                  {students.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No students in this class
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <ProgressAnalytics
            studentId={selectedStudent}
            studentName={students.find((s) => s.id === selectedStudent)?.name}
            showDetailed={true}
          />
        )}
      </div>
    </div>
  )
}
