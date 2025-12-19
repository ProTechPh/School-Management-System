"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Video, LinkIcon, File, Search, Eye, Loader2, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface LessonMaterial {
  id: string
  name: string
  type: string
  url: string | null
}

interface Lesson {
  id: string
  title: string
  description: string | null
  class_id: string
  class_name: string
  teacher_name: string | null
  materials: LessonMaterial[]
}

interface ClassInfo {
  id: string
  name: string
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState<string>("all")
  const [userId, setUserId] = useState("")
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const { data: lessonData } = await supabase
      .from("lessons")
      .select(`
        id, title, description, class_id,
        class:classes (name),
        teacher:users!lessons_teacher_id_fkey (name),
        materials:lesson_materials (id, name, type, url)
      `)
      .order("created_at", { ascending: false })

    if (lessonData) {
      setLessons(lessonData.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        class_id: l.class_id,
        class_name: (l.class as any)?.name || "Unknown",
        teacher_name: (l.teacher as any)?.name || null,
        materials: (l.materials as any) || [],
      })))
    }

    const { data: classData } = await supabase
      .from("classes")
      .select("id, name")
      .order("name")

    if (classData) setClasses(classData)

    setLoading(false)
  }

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lesson.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesClass = filterClass === "all" || lesson.class_id === filterClass
    return matchesSearch && matchesClass
  })

  const materialIcon: Record<string, any> = {
    pdf: FileText,
    video: Video,
    link: LinkIcon,
    document: File,
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Lessons" subtitle="View all lessons across the school" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Lessons" subtitle="View all lessons across the school" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search lessons..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
          </div>
          <div className="text-sm text-muted-foreground">{filteredLessons.length} lessons found</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{lesson.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{lesson.class_name}</p>
                  </div>
                  <Badge variant="secondary">{lesson.materials.length} files</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{lesson.description || "No description"}</p>

                {lesson.materials.length > 0 && (
                  <div className="mb-4 space-y-1">
                    {lesson.materials.slice(0, 2).map((material) => {
                      const Icon = materialIcon[material.type] || File
                      return (
                        <div key={material.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{material.name}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{lesson.teacher_name || "No teacher"}</span>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedLesson(lesson); setViewDialogOpen(true); }}>
                    <Eye className="mr-2 h-4 w-4" />View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* View Lesson Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedLesson?.title}</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class</p>
                <p className="text-sm">{selectedLesson.class_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teacher</p>
                <p className="text-sm">{selectedLesson.teacher_name || "No teacher assigned"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{selectedLesson.description || "No description"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Materials ({selectedLesson.materials.length})</p>
                {selectedLesson.materials.length > 0 ? (
                  <div className="space-y-2">
                    {selectedLesson.materials.map((material) => {
                      const Icon = materialIcon[material.type] || File
                      return material.url ? (
                        <a
                          key={material.id}
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{material.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{material.type}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ) : (
                        <div key={material.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{material.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{material.type}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No materials attached</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
