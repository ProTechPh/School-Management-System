"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { QrCode, Plus, Users, Clock, StopCircle, MapPin, Loader2 } from "lucide-react"
import { useSchoolLocationStore } from "@/lib/school-location-store"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"

interface TeacherClass {
  id: string
  name: string
  subject: string
}

interface Student {
  id: string
  name: string
  grade: string
  section: string
}

interface QRSession {
  id: string
  class_id: string
  class_name: string
  teacher_id: string
  date: string
  start_time: string
  end_time: string | null
  qr_code: string
  status: "active" | "expired"
  require_location: boolean
  checkins: { student_id: string }[]
}

export default function TeacherQRAttendancePage() {
  const [sessions, setSessions] = useState<QRSession[]>([])
  const [open, setOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTeacher, setCurrentTeacher] = useState<{ id: string; name: string } | null>(null)
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [formData, setFormData] = useState({
    classId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: format(new Date(), "HH:mm"),
    endTime: "",
    requireLocation: true,
  })
  
  const { location: schoolLocation } = useSchoolLocationStore()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", user.id)
      .single()
    
    if (userData) {
      setCurrentTeacher(userData)
    }

    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, subject")
      .eq("teacher_id", user.id)
      .order("name")

    if (classData) {
      setTeacherClasses(classData)
    }

    // Fetch QR sessions from database
    const { data: sessionData } = await supabase
      .from("qr_attendance_sessions")
      .select(`
        id, class_id, teacher_id, date, start_time, end_time, qr_code, status, require_location,
        class:classes (name),
        checkins:qr_checkins (student_id)
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })

    if (sessionData) {
      setSessions(sessionData.map(s => ({
        ...s,
        class_name: (s.class as any)?.name || "Unknown"
      })))
    }

    const { data: studentData } = await supabase
      .from("users")
      .select(`id, name, student_profiles (grade, section)`)
      .eq("role", "student")

    if (studentData) {
      setStudents(studentData.map(s => ({
        id: s.id,
        name: s.name,
        grade: (s.student_profiles as any)?.[0]?.grade || "",
        section: (s.student_profiles as any)?.[0]?.section || "",
      })))
    }

    setLoading(false)
  }

  const activeSessions = sessions.filter((s) => s.status === "active")

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTeacher) return
    
    const selectedClass = teacherClasses.find((c) => c.id === formData.classId)
    if (!selectedClass) return

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const qrCode = `ATT-${formData.classId.substring(0, 8).toUpperCase()}-${formData.date.replace(/-/g, "")}-${randomSuffix}`
    
    const supabase = createClient()
    const { data, error } = await supabase
      .from("qr_attendance_sessions")
      .insert({
        class_id: formData.classId,
        teacher_id: currentTeacher.id,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime || null,
        qr_code: qrCode,
        status: "active",
        require_location: formData.requireLocation,
      })
      .select()
      .single()

    if (error) {
      toast.error("Failed to create session", { description: error.message })
      return
    }

    const newSession: QRSession = {
      ...data,
      class_name: selectedClass.name,
      checkins: []
    }

    setSessions(prev => [newSession, ...prev])
    setSelectedSessionId(data.id)
    setOpen(false)
    toast.success("Attendance session created")
    setFormData({
      classId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: format(new Date(), "HH:mm"),
      endTime: "",
      requireLocation: true,
    })
  }

  const handleEndSession = async (sessionId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("qr_attendance_sessions")
      .update({ status: "expired" })
      .eq("id", sessionId)

    if (error) {
      toast.error("Failed to end session")
      return
    }

    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, status: "expired" as const } : s
    ))
    setSelectedSessionId(null)
    toast.success("Session ended")
  }

  const activeSession = selectedSessionId ? sessions.find((s) => s.id === selectedSessionId) : null

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <DashboardHeader title="QR Attendance" subtitle="Generate QR codes for student attendance check-in" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="QR Attendance"
        subtitle="Generate QR codes for student attendance check-in"
        userId={currentTeacher?.id}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Attendance QR Code
            </CardTitle>
            <CardDescription>Display this QR code for students to scan and check in</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {activeSession && activeSession.status === "active" ? (
              <>
                <QRCodeGenerator data={activeSession.qr_code} size={250} />
                <div className="text-center">
                  <p className="font-semibold">{activeSession.class_name}</p>
                  <p className="text-sm text-muted-foreground">Code: {activeSession.qr_code}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {activeSession.start_time} {activeSession.end_time && `- ${activeSession.end_time}`}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {activeSession.checkins?.length || 0} checked in
                    </Badge>
                    <Badge variant={activeSession.require_location ? "default" : "secondary"} className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {activeSession.require_location ? "Location Required" : "No Location Check"}
                    </Badge>
                  </div>
                </div>
                <Button variant="destructive" onClick={() => handleEndSession(activeSession.id)}>
                  <StopCircle className="mr-2 h-4 w-4" />
                  End Session
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <QrCode className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No active attendance session</p>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" />Start New Session</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Attendance Session</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSession} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                          <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                          <SelectContent>
                            {teacherClasses.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time <span className="text-muted-foreground text-xs">(optional)</span></Label>
                          <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="space-y-0.5">
                          <Label htmlFor="require-location" className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />Require Location
                          </Label>
                          <p className="text-xs text-muted-foreground">Students must be within school area</p>
                        </div>
                        <Switch id="require-location" checked={formData.requireLocation} onCheckedChange={(checked) => setFormData({ ...formData, requireLocation: checked })} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={!formData.classId}>Create Session</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>Past and active attendance sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No attendance sessions yet</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{session.class_name}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(session.date), "MMM d, yyyy")} • {session.start_time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.status === "active" ? "default" : "secondary"}>{session.status}</Badge>
                      <Badge variant="outline"><Users className="mr-1 h-3 w-3" />{session.checkins?.length || 0}</Badge>
                      {session.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => setSelectedSessionId(session.id)}>View</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {activeSession && (
        <Card>
          <CardHeader>
            <CardTitle>Checked-in Students</CardTitle>
            <CardDescription>Students who have scanned the QR code for {activeSession.class_name}</CardDescription>
          </CardHeader>
          <CardContent>
            {!activeSession.checkins?.length ? (
              <p className="text-center text-sm text-muted-foreground py-4">No students have checked in yet</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {activeSession.checkins.map((checkin) => {
                  const student = students.find((s) => s.id === checkin.student_id)
                  if (!student) return null
                  return (
                    <div key={checkin.student_id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {student.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">Grade {student.grade}-{student.section}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
