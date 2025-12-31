"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Video, LinkIcon, Download, Play, ExternalLink, File, BookOpen, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Material {
  id: string
  name: string
  type: string
  url: string
  size: string | null
}

interface Lesson {
  id: string
  title: string
  description: string | null
  content: string | null
  class_name: string
  teacher_name: string | null
  materials: Material[]
}

// SECURITY FIX: Sanitize URLs
const getSafeUrl = (url: string) => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  return "#"
}

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Get student's enrolled classes
    const { data: enrollments } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", user.id)

    if (enrollments && enrollments.length > 0) {
      const classIds = enrollments.map(e => e.class_id)

      const { data: lessonData } = await supabase
        .from("lessons")
        .select(`
          id, title, description, content,
          class:classes (name),
          teacher:users!lessons_teacher_id_fkey (name),
          materials:lesson_materials (id, name, type, url, size)
        `)
        .in("class_id", classIds)
        .order("created_at", { ascending: false })

      if (lessonData) {
        setLessons(lessonData.map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          content: l.content,
          class_name: (l.class as any)?.name || "Unknown",
          teacher_name: (l.teacher as any)?.name || null,
          materials: (l.materials as any) || [],
        })))
      }
    }

    setLoading(false)
  }

  const materialIcon: Record<string, any> = {
    pdf: FileText,
    video: Video,
    link: LinkIcon,
    document: File,
  }

  const materialAction: Record<string, { icon: any; label: string }> = {
    pdf: { icon: Download, label: "Download" },
    video: { icon: Play, label: "Watch" },
    link: { icon: ExternalLink, label: "Open" },
    document: { icon: Download, label: "Download" },
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Lessons" subtitle="Access your class lessons and materials" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Lessons" subtitle="Access your class lessons and materials" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">My Lessons</h2>
          <p className="text-sm text-muted-foreground">{lessons.length} lessons available</p>
        </div>

        <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedLesson?.title}</DialogTitle>
            </DialogHeader>
            {selectedLesson && (
              <div className="py-4">
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="secondary">{selectedLesson.class_name}</Badge>
                  <span className="text-sm text-muted-foreground">by {selectedLesson.teacher_name || "Unknown"}</span>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">{selectedLesson.description}</p>

                <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="mb-2 font-medium text-foreground">Lesson Content</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedLesson.content || "No content"}</p>
                </div>

                {selectedLesson.materials.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-medium text-foreground">Learning Materials</h4>
                    <div className="space-y-2">
                      {selectedLesson.materials.map((material) => {
                        const Icon = materialIcon[material.type] || File
                        const Action = materialAction[material.type] || materialAction.document
                        const safeUrl = getSafeUrl(material.url)
                        
                        return material.url ? (
                          <a
                            key={material.id}
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={(e) => {
                              if (safeUrl === "#") {
                                e.preventDefault()
                                alert("Invalid or unsafe link")
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{material.name}</p>
                                {material.size && <p className="text-xs text-muted-foreground">{material.size}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Action.icon className="h-4 w-4" />
                              <span>{Action.label}</span>
                            </div>
                          </a>
                        ) : (
                          <div key={material.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{material.name}</p>
                                {material.size && <p className="text-xs text-muted-foreground">{material.size}</p>}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">No link</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {lessons.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => {
              const hasVideo = lesson.materials.some((m) => m.type === "video")
              const hasPdf = lesson.materials.some((m) => m.type === "pdf")
              return (
                <Card key={lesson.id} className="bg-card cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setSelectedLesson(lesson)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{lesson.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{lesson.class_name}</p>
                      </div>
                      <div className="flex gap-1">
                        {hasVideo && (
                          <Badge variant="outline" className="text-xs"><Video className="mr-1 h-3 w-3" />Video</Badge>
                        )}
                        {hasPdf && (
                          <Badge variant="outline" className="text-xs"><FileText className="mr-1 h-3 w-3" />PDF</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{lesson.description || "No description"}</p>
                    <div className="mb-4 text-sm text-muted-foreground">
                      <span>{lesson.teacher_name || "Unknown teacher"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{lesson.materials.length} materials</span>
                      <Button variant="ghost" size="sm"><BookOpen className="mr-2 h-4 w-4" />View Lesson</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No lessons available yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}