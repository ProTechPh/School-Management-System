"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Plus, FileText, Video, LinkIcon, Upload, Trash2, Eye, Edit, File, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface ClassInfo {
  id: string
  name: string
}

interface Material {
  id: string
  name: string
  type: string
  url: string
}

interface Lesson {
  id: string
  title: string
  description: string | null
  content: string | null
  class_id: string
  class_name: string
  materials: Material[]
  updated_at: string
}

export default function TeacherLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [userId, setUserId] = useState("")

  const [newLesson, setNewLesson] = useState({
    title: "",
    classId: "",
    description: "",
    content: "",
    materials: [] as { id: string; name: string; type: string; url: string }[],
  })
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editLesson, setEditLesson] = useState<{
    id: string
    title: string
    classId: string
    description: string
    content: string
    materials: { id: string; name: string; type: string; url: string; isNew?: boolean }[]
    deletedMaterialIds: string[]
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Fetch teacher's classes
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name")
      .eq("teacher_id", user.id)
      .order("name")

    if (classData) setClasses(classData)

    // Fetch lessons
    const { data: lessonData } = await supabase
      .from("lessons")
      .select(`
        id, title, description, content, class_id, updated_at,
        class:classes (name),
        materials:lesson_materials (id, name, type, url)
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })

    if (lessonData) {
      setLessons(lessonData.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        content: l.content,
        class_id: l.class_id,
        class_name: (l.class as any)?.name || "Unknown",
        materials: (l.materials as any) || [],
        updated_at: l.updated_at,
      })))
    }

    setLoading(false)
  }

  const handleAddMaterial = (type: string) => {
    const material = {
      id: `temp-${Date.now()}`,
      name: type === "pdf" ? "Document.pdf" : type === "video" ? "Video.mp4" : "Link",
      type,
      url: "",
    }
    setNewLesson((prev) => ({
      ...prev,
      materials: [...prev.materials, material],
    }))
  }

  const handleRemoveMaterial = (id: string) => {
    setNewLesson((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== id),
    }))
  }

  const handleMaterialChange = (id: string, field: string, value: string) => {
    setNewLesson((prev) => ({
      ...prev,
      materials: prev.materials.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }))
  }

  const handleCreateLesson = async () => {
    if (!newLesson.title || !newLesson.classId) return
    setSaving(true)

    const supabase = createClient()
    
    const { data: lessonData, error } = await supabase
      .from("lessons")
      .insert({
        title: newLesson.title,
        class_id: newLesson.classId,
        teacher_id: userId,
        description: newLesson.description || null,
        content: newLesson.content || null,
      })
      .select()
      .single()

    if (error) {
      toast.error("Failed to create lesson", { description: error.message })
      setSaving(false)
      return
    }

    if (lessonData && newLesson.materials.length > 0) {
      const materialsToInsert = newLesson.materials
        .filter(m => m.name && m.url)
        .map(m => ({
          lesson_id: lessonData.id,
          name: m.name,
          type: m.type,
          url: m.url,
        }))
      
      if (materialsToInsert.length > 0) {
        const { error: matError } = await supabase.from("lesson_materials").insert(materialsToInsert)
        if (matError) {
          toast.error("Lesson created but materials failed to save", { description: matError.message })
        }
      }
    }

    toast.success("Lesson created successfully")
    setNewLesson({ title: "", classId: "", description: "", content: "", materials: [] })
    setIsCreateOpen(false)
    setSaving(false)
    fetchData()
  }

  const openEditDialog = (lesson: Lesson) => {
    setEditLesson({
      id: lesson.id,
      title: lesson.title,
      classId: lesson.class_id,
      description: lesson.description || "",
      content: lesson.content || "",
      materials: lesson.materials.map(m => ({ ...m, isNew: false })),
      deletedMaterialIds: [],
    })
    setEditDialogOpen(true)
  }

  const handleEditAddMaterial = (type: string) => {
    if (!editLesson) return
    const material = {
      id: `temp-${Date.now()}`,
      name: type === "pdf" ? "Document.pdf" : type === "video" ? "Video.mp4" : "Link",
      type,
      url: "",
      isNew: true,
    }
    setEditLesson(prev => prev ? { ...prev, materials: [...prev.materials, material] } : null)
  }

  const handleEditRemoveMaterial = (id: string, isNew?: boolean) => {
    if (!editLesson) return
    if (!isNew && !id.startsWith("temp-")) {
      setEditLesson(prev => prev ? {
        ...prev,
        materials: prev.materials.filter(m => m.id !== id),
        deletedMaterialIds: [...prev.deletedMaterialIds, id],
      } : null)
    } else {
      setEditLesson(prev => prev ? {
        ...prev,
        materials: prev.materials.filter(m => m.id !== id),
      } : null)
    }
  }

  const handleEditMaterialChange = (id: string, field: string, value: string) => {
    if (!editLesson) return
    setEditLesson(prev => prev ? {
      ...prev,
      materials: prev.materials.map(m => m.id === id ? { ...m, [field]: value } : m),
    } : null)
  }

  const handleUpdateLesson = async () => {
    if (!editLesson || !editLesson.title || !editLesson.classId) return
    setSaving(true)

    const supabase = createClient()
    
    // Update lesson
    const { error } = await supabase
      .from("lessons")
      .update({
        title: editLesson.title,
        class_id: editLesson.classId,
        description: editLesson.description || null,
        content: editLesson.content || null,
      })
      .eq("id", editLesson.id)

    if (error) {
      toast.error("Failed to update lesson", { description: error.message })
      setSaving(false)
      return
    }

    // Delete removed materials
    if (editLesson.deletedMaterialIds.length > 0) {
      await supabase.from("lesson_materials").delete().in("id", editLesson.deletedMaterialIds)
    }

    // Add new materials
    const newMaterials = editLesson.materials
      .filter(m => m.isNew && m.name && m.url)
      .map(m => ({
        lesson_id: editLesson.id,
        name: m.name,
        type: m.type,
        url: m.url,
      }))

    if (newMaterials.length > 0) {
      await supabase.from("lesson_materials").insert(newMaterials)
    }

    // Update existing materials
    const existingMaterials = editLesson.materials.filter(m => !m.isNew && !m.id.startsWith("temp-"))
    for (const mat of existingMaterials) {
      await supabase.from("lesson_materials").update({ name: mat.name, url: mat.url }).eq("id", mat.id)
    }

    toast.success("Lesson updated successfully")
    setEditDialogOpen(false)
    setEditLesson(null)
    setSaving(false)
    fetchData()
  }

  const materialIcon: Record<string, any> = {
    pdf: FileText,
    video: Video,
    link: LinkIcon,
    document: File,
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Lessons" subtitle="Create and manage lesson content" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Lessons" subtitle="Create and manage lesson content" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">My Lessons</h2>
            <p className="text-sm text-muted-foreground">{lessons.length} lessons created</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Create Lesson</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Lesson</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Lesson Title</Label>
                    <Input placeholder="Enter lesson title" value={newLesson.title} onChange={(e) => setNewLesson((prev) => ({ ...prev, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={newLesson.classId} onValueChange={(value) => setNewLesson((prev) => ({ ...prev, classId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="Brief description of the lesson" value={newLesson.description} onChange={(e) => setNewLesson((prev) => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Lesson Content</Label>
                  <Textarea placeholder="Enter the main lesson content..." rows={6} value={newLesson.content} onChange={(e) => setNewLesson((prev) => ({ ...prev, content: e.target.value }))} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Learning Materials</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddMaterial("pdf")}><FileText className="mr-1 h-3 w-3" />PDF</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddMaterial("video")}><Video className="mr-1 h-3 w-3" />Video</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddMaterial("link")}><LinkIcon className="mr-1 h-3 w-3" />Link</Button>
                    </div>
                  </div>

                  {newLesson.materials.length > 0 ? (
                    <div className="space-y-2">
                      {newLesson.materials.map((material) => {
                        const Icon = materialIcon[material.type] || File
                        return (
                          <div key={material.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 grid gap-2 sm:grid-cols-2">
                              <Input placeholder="File name" value={material.name} onChange={(e) => handleMaterialChange(material.id, "name", e.target.value)} />
                              <Input placeholder={material.type === "link" ? "URL" : "File path"} value={material.url} onChange={(e) => handleMaterialChange(material.id, "url", e.target.value)} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMaterial(material.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Add PDFs, videos, or links to enhance your lesson</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleCreateLesson} disabled={!newLesson.title || !newLesson.classId || saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Lesson
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
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
                  <div className="mb-4 space-y-2">
                    {lesson.materials.slice(0, 2).map((material) => {
                      const MatIcon = materialIcon[material.type] || File
                      return (
                        <div key={material.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MatIcon className="h-4 w-4" />
                          <span className="truncate">{material.name}</span>
                        </div>
                      )
                    })}
                    {lesson.materials.length > 2 && (
                      <p className="text-xs text-muted-foreground">+{lesson.materials.length - 2} more</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Updated {new Date(lesson.updated_at).toLocaleDateString()}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedLesson(lesson); setViewDialogOpen(true); }}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(lesson)}><Edit className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* View Lesson Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{selectedLesson.description || "No description"}</p>
              </div>
              {selectedLesson.content && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Content</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedLesson.content}</p>
                </div>
              )}
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

      {/* Edit Lesson Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditLesson(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>
          {editLesson && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Lesson Title</Label>
                  <Input placeholder="Enter lesson title" value={editLesson.title} onChange={(e) => setEditLesson(prev => prev ? { ...prev, title: e.target.value } : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={editLesson.classId} onValueChange={(value) => setEditLesson(prev => prev ? { ...prev, classId: value } : null)}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Brief description of the lesson" value={editLesson.description} onChange={(e) => setEditLesson(prev => prev ? { ...prev, description: e.target.value } : null)} />
              </div>
              <div className="space-y-2">
                <Label>Lesson Content</Label>
                <Textarea placeholder="Enter the main lesson content..." rows={6} value={editLesson.content} onChange={(e) => setEditLesson(prev => prev ? { ...prev, content: e.target.value } : null)} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Learning Materials</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleEditAddMaterial("pdf")}><FileText className="mr-1 h-3 w-3" />PDF</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleEditAddMaterial("video")}><Video className="mr-1 h-3 w-3" />Video</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleEditAddMaterial("link")}><LinkIcon className="mr-1 h-3 w-3" />Link</Button>
                  </div>
                </div>

                {editLesson.materials.length > 0 ? (
                  <div className="space-y-2">
                    {editLesson.materials.map((material) => {
                      const Icon = materialIcon[material.type] || File
                      return (
                        <div key={material.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 grid gap-2 sm:grid-cols-2">
                            <Input placeholder="File name" value={material.name} onChange={(e) => handleEditMaterialChange(material.id, "name", e.target.value)} />
                            <Input placeholder={material.type === "link" ? "URL" : "File URL"} value={material.url} onChange={(e) => handleEditMaterialChange(material.id, "url", e.target.value)} />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleEditRemoveMaterial(material.id, material.isNew)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Add PDFs, videos, or links to enhance your lesson</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditLesson(null); }}>Cancel</Button>
                <Button onClick={handleUpdateLesson} disabled={!editLesson.title || !editLesson.classId || saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
