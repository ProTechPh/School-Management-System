"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, FileQuestion, Search, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Quiz {
  id: string
  title: string
  description: string | null
  duration: number
  due_date: string | null
  status: "draft" | "published" | "closed"
  class_id: string
  class_name: string
  teacher_name: string | null
  question_count: number
}

interface ClassInfo {
  id: string
  name: string
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const { data: quizData } = await supabase
      .from("quizzes")
      .select(`
        id, title, description, duration, due_date, status, class_id,
        class:classes (name),
        teacher:users!quizzes_teacher_id_fkey (name),
        questions:quiz_questions (id)
      `)
      .order("created_at", { ascending: false })

    if (quizData) {
      setQuizzes(quizData.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        duration: q.duration,
        due_date: q.due_date,
        status: q.status,
        class_id: q.class_id,
        class_name: (q.class as any)?.name || "Unknown",
        teacher_name: (q.teacher as any)?.name || null,
        question_count: (q.questions as any)?.length || 0,
      })))
    }

    const { data: classData } = await supabase
      .from("classes")
      .select("id, name")
      .order("name")

    if (classData) setClasses(classData)

    setLoading(false)
  }

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quiz.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesClass = filterClass === "all" || quiz.class_id === filterClass
    const matchesStatus = filterStatus === "all" || quiz.status === filterStatus
    return matchesSearch && matchesClass && matchesStatus
  })

  const stats = {
    total: quizzes.length,
    published: quizzes.filter(q => q.status === "published").length,
    draft: quizzes.filter(q => q.status === "draft").length,
    closed: quizzes.filter(q => q.status === "closed").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Quizzes" subtitle="View all quizzes across the school" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Quizzes" subtitle="View all quizzes across the school" userId={userId} />
      <div className="p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Quizzes</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{stats.published}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
              <p className="text-sm text-muted-foreground">Draft</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{stats.closed}</p>
              <p className="text-sm text-muted-foreground">Closed</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search quizzes..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{quiz.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{quiz.class_name}</p>
                  </div>
                  <Badge variant={quiz.status === "published" ? "default" : "secondary"}>{quiz.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{quiz.teacher_name || "No teacher"}</p>

                <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileQuestion className="h-4 w-4" />
                    <span>{quiz.question_count} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{quiz.duration} min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Due: {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : "No due date"}
                  </span>
                  <Button variant="ghost" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
