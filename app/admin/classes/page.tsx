"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Users, Clock, MapPin, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ClassInfo {
  id: string
  name: string
  grade: string
  section: string
  subject: string
  room: string | null
  schedule: string | null
  teacher_id: string | null
  teacher_name: string | null
  student_count: number
}

interface Teacher {
  id: string
  name: string
  subject: string
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSubject, setFilterSubject] = useState<string>("all")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    grade: "10",
    section: "A",
    subject: "",
    teacher_id: "",
    room: "",
    scheduleDays: "MWF",
    scheduleTime: "9:00 AM",
  })

  const dayOptions = [
    { value: "MWF", label: "Mon, Wed, Fri" },
    { value: "TTh", label: "Tue, Thu" },
    { value: "Daily", label: "Mon - Fri" },
    { value: "MF", label: "Mon, Fri" },
    { value: "MW", label: "Mon, Wed" },
    { value: "WF", label: "Wed, Fri" },
  ]

  const timeOptions = [
    "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
    "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM", "5:00 PM",
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    // Fetch classes with teacher info
    const { data: classData } = await supabase
      .from("classes")
      .select(`
        id, name, grade, section, subject, room, schedule, teacher_id,
        teacher:users!classes_teacher_id_fkey (name)
      `)
      .order("name")

    // Fetch student counts
    const { data: enrollments } = await supabase
      .from("class_students")
      .select("class_id")

    const countMap: Record<string, number> = {}
    enrollments?.forEach(e => {
      countMap[e.class_id] = (countMap[e.class_id] || 0) + 1
    })

    if (classData) {
      setClasses(classData.map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        section: c.section,
        subject: c.subject,
        room: c.room,
        schedule: c.schedule,
        teacher_id: c.teacher_id,
        teacher_name: (c.teacher as any)?.name || null,
        student_count: countMap[c.id] || 0,
      })))
    }

    // Fetch teachers
    const { data: teacherData } = await supabase
      .from("users")
      .select(`id, name, teacher_profiles!inner (subject)`)
      .eq("role", "teacher")
      .order("name")

    if (teacherData) {
      setTeachers(teacherData.map(t => {
        const profile = t.teacher_profiles as any
        // Handle both array and object responses
        const subject = Array.isArray(profile) ? profile[0]?.subject : profile?.subject
        return {
          id: t.id,
          name: t.name,
          subject: subject || "N/A",
        }
      }))
    }

    setLoading(false)
  }

  const subjects = [...new Set(classes.map((c) => c.subject))]

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesSubject = filterSubject === "all" || cls.subject === filterSubject
    return matchesSearch && matchesSubject
  })

  const resetForm = () => {
    setFormData({ name: "", grade: "10", section: "A", subject: "", teacher_id: "", room: "", scheduleDays: "MWF", scheduleTime: "9:00 AM" })
  }

  const getScheduleString = () => {
    if (!formData.scheduleDays || !formData.scheduleTime) return null
    return `${formData.scheduleDays} ${formData.scheduleTime}`
  }

  const parseSchedule = (schedule: string | null) => {
    if (!schedule) return { days: "MWF", time: "9:00 AM" }
    const parts = schedule.split(" ")
    const days = parts[0] || "MWF"
    const time = parts.slice(1).join(" ") || "9:00 AM"
    return { days, time }
  }

  // Convert time string to 24-hour format for database
  const convertTo24Hour = (time12: string) => {
    const [time, modifier] = time12.split(" ")
    let [hours, minutes] = time.split(":")
    let h = parseInt(hours, 10)
    if (modifier === "PM" && h !== 12) h += 12
    if (modifier === "AM" && h === 12) h = 0
    return `${h.toString().padStart(2, "0")}:${minutes}:00`
  }

  // Get days array from schedule code
  const getDaysFromCode = (code: string): string[] => {
    const dayMap: Record<string, string[]> = {
      "MWF": ["Monday", "Wednesday", "Friday"],
      "TTh": ["Tuesday", "Thursday"],
      "Daily": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "MF": ["Monday", "Friday"],
      "MW": ["Monday", "Wednesday"],
      "WF": ["Wednesday", "Friday"],
    }
    return dayMap[code] || ["Monday", "Wednesday", "Friday"]
  }

  // Create schedule entries for a class
  const createScheduleEntries = async (supabase: any, classId: string, room: string | null) => {
    const days = getDaysFromCode(formData.scheduleDays)
    const startTime = convertTo24Hour(formData.scheduleTime)
    // End time is 1 hour after start
    const startHour = parseInt(startTime.split(":")[0], 10)
    const endTime = `${(startHour + 1).toString().padStart(2, "0")}:00:00`

    // Delete existing schedules for this class
    await supabase.from("schedules").delete().eq("class_id", classId)

    // Insert new schedules
    const scheduleEntries = days.map(day => ({
      class_id: classId,
      day,
      start_time: startTime,
      end_time: endTime,
      room: room || null,
    }))

    await supabase.from("schedules").insert(scheduleEntries)
  }

  const handleAddClass = async () => {
    if (!formData.name || !formData.subject) return
    setSaving(true)

    const supabase = createClient()
    
    const { data: newClass, error } = await supabase.from("classes").insert({
      name: formData.name,
      grade: formData.grade,
      section: formData.section,
      subject: formData.subject,
      teacher_id: formData.teacher_id || null,
      room: formData.room || null,
      schedule: getScheduleString(),
    }).select().single()

    if (error) {
      toast.error("Failed to create class", { description: error.message })
      setSaving(false)
      return
    }

    // Create schedule entries
    if (newClass) {
      await createScheduleEntries(supabase, newClass.id, formData.room || null)
    }

    resetForm()
    setAddDialogOpen(false)
    setSaving(false)
    toast.success("Class created successfully")
    fetchData()
  }

  const handleEditClass = async () => {
    if (!selectedClass || !formData.name || !formData.subject) return
    setSaving(true)

    const supabase = createClient()
    
    const { error } = await supabase
      .from("classes")
      .update({
        name: formData.name,
        grade: formData.grade,
        section: formData.section,
        subject: formData.subject,
        teacher_id: formData.teacher_id || null,
        room: formData.room || null,
        schedule: getScheduleString(),
      })
      .eq("id", selectedClass.id)

    if (error) {
      toast.error("Failed to update class", { description: error.message })
      setSaving(false)
      return
    }

    // Update schedule entries
    await createScheduleEntries(supabase, selectedClass.id, formData.room || null)

    resetForm()
    setEditDialogOpen(false)
    setSelectedClass(null)
    setSaving(false)
    toast.success("Class updated successfully")
    fetchData()
  }

  const handleDeleteClass = async () => {
    if (!selectedClass) return
    setSaving(true)

    const supabase = createClient()
    
    // First delete schedules
    await supabase.from("schedules").delete().eq("class_id", selectedClass.id)
    
    // Delete enrollments
    await supabase.from("class_students").delete().eq("class_id", selectedClass.id)
    
    // Then delete the class
    const { error } = await supabase.from("classes").delete().eq("id", selectedClass.id)

    if (error) {
      toast.error("Failed to delete class", { description: error.message })
      setSaving(false)
      return
    }

    setDeleteDialogOpen(false)
    setSelectedClass(null)
    setSaving(false)
    toast.success("Class deleted successfully")
    fetchData()
  }

  const openEditDialog = (cls: ClassInfo) => {
    setSelectedClass(cls)
    setFormData({
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      subject: cls.subject,
      teacher_id: cls.teacher_id || "",
      room: cls.room || "",
      scheduleDays: parseSchedule(cls.schedule).days,
      scheduleTime: parseSchedule(cls.schedule).time,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (cls: ClassInfo) => {
    setSelectedClass(cls)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Classes" subtitle="Manage class schedules and assignments" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Classes" subtitle="Manage class schedules and assignments" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search classes..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Class</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>Set up a new class with teacher assignment.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Class Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Algebra II" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Grade</Label>
                    <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Grade 7</SelectItem>
                        <SelectItem value="8">Grade 8</SelectItem>
                        <SelectItem value="9">Grade 9</SelectItem>
                        <SelectItem value="10">Grade 10</SelectItem>
                        <SelectItem value="11">Grade 11</SelectItem>
                        <SelectItem value="12">Grade 12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Section</Label>
                    <Select value={formData.section} onValueChange={(v) => setFormData({ ...formData, section: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Section A</SelectItem>
                        <SelectItem value="B">Section B</SelectItem>
                        <SelectItem value="C">Section C</SelectItem>
                        <SelectItem value="D">Section D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Mathematics" />
                </div>
                <div className="grid gap-2">
                  <Label>Assign Teacher</Label>
                  <Select value={formData.teacher_id} onValueChange={(v) => setFormData({ ...formData, teacher_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Room</Label>
                    <Input value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="e.g., Room 101" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Days</Label>
                    <Select value={formData.scheduleDays} onValueChange={(v) => setFormData({ ...formData, scheduleDays: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {dayOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Time</Label>
                    <Select value={formData.scheduleTime} onValueChange={(v) => setFormData({ ...formData, scheduleTime: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleAddClass} disabled={saving || !formData.name || !formData.subject}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Class
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="bg-card hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{cls.teacher_name || "No teacher assigned"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{cls.subject}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(cls)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(cls)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{cls.student_count} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{cls.schedule || "No schedule"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{cls.room || "TBA"}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="outline">Grade {cls.grade} - {cls.section}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Showing {filteredClasses.length} of {classes.length} classes
        </p>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { resetForm(); setSelectedClass(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Class Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Algebra II" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Grade</Label>
                <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Section</Label>
                <Select value={formData.section} onValueChange={(v) => setFormData({ ...formData, section: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                    <SelectItem value="C">Section C</SelectItem>
                    <SelectItem value="D">Section D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Mathematics" />
            </div>
            <div className="grid gap-2">
              <Label>Assign Teacher</Label>
              <Select value={formData.teacher_id || "none"} onValueChange={(v) => setFormData({ ...formData, teacher_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No teacher</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Room</Label>
                <Input value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="e.g., Room 101" />
              </div>
              <div className="grid gap-2">
                <Label>Days</Label>
                <Select value={formData.scheduleDays} onValueChange={(v) => setFormData({ ...formData, scheduleDays: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dayOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <Select value={formData.scheduleTime} onValueChange={(v) => setFormData({ ...formData, scheduleTime: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleEditClass} disabled={saving || !formData.name || !formData.subject}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedClass?.name}"? This will also remove all student enrollments for this class. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
