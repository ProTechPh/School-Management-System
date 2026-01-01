"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Check, X, Clock, AlertCircle, Loader2, CalendarIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type AttendanceStatus = "present" | "absent" | "late" | "excused"

interface ClassInfo {
  id: string
  name: string
  grade: string
  section: string
}

interface Student {
  id: string
  name: string
  email: string
  avatar: string | null
}

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [userId, setUserId] = useState("")

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) fetchClassData()
  }, [selectedClass, selectedDate])

  const fetchClasses = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    try {
      const response = await fetch("/api/teacher/my-classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
        if (data.classes.length > 0) setSelectedClass(data.classes[0].id)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassData = async () => {
    if (!selectedClass) return
    
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const response = await fetch("/api/teacher/attendance/class-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClass, date: dateStr })
      })

      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
        setAttendance(data.attendance || {})
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
      toast.error("Failed to load attendance data")
    }
  }

  const handleAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const dateStr = format(selectedDate, "yyyy-MM-dd")

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      class_id: selectedClass,
      date: dateStr,
      status,
    }))

    if (records.length > 0) {
      const { error } = await supabase.from("attendance_records").upsert(records, {
        onConflict: "student_id,class_id,date",
      })
      
      if (error) {
        toast.error("Failed to save attendance", { description: error.message })
        setSaving(false)
        return
      }
    }

    setSaving(false)
    toast.success("Attendance saved successfully")
  }

  const getStatusIcon = (status: AttendanceStatus | undefined) => {
    switch (status) {
      case "present": return <Check className="h-4 w-4 text-primary" />
      case "absent": return <X className="h-4 w-4 text-destructive" />
      case "late": return <Clock className="h-4 w-4 text-yellow-500" />
      case "excused": return <AlertCircle className="h-4 w-4 text-muted-foreground" />
      default: return null
    }
  }

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter((s) => s === "present").length,
    absent: Object.values(attendance).filter((s) => s === "absent").length,
    late: Object.values(attendance).filter((s) => s === "late").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Take Attendance" subtitle="Record student attendance for your classes" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Take Attendance" subtitle="Record student attendance for your classes" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} - Grade {cls.grade}{cls.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3">
            <Badge variant="outline" className="py-1.5">Total: {stats.total}</Badge>
            <Badge variant="default" className="py-1.5">Present: {stats.present}</Badge>
            <Badge variant="destructive" className="py-1.5">Absent: {stats.absent}</Badge>
          </div>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {classes.find((c) => c.id === selectedClass)?.name || "Select a Class"} - {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {student.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-card-foreground">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(attendance[student.id])}
                    <div className="flex gap-1">
                      <Button size="sm" variant={attendance[student.id] === "present" ? "default" : "outline"} onClick={() => handleAttendance(student.id, "present")}>Present</Button>
                      <Button size="sm" variant={attendance[student.id] === "absent" ? "destructive" : "outline"} onClick={() => handleAttendance(student.id, "absent")}>Absent</Button>
                      <Button size="sm" variant={attendance[student.id] === "late" ? "secondary" : "outline"} onClick={() => handleAttendance(student.id, "late")}>Late</Button>
                    </div>
                  </div>
                </div>
              ))}

              {students.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">No students found for this class.</p>
              )}
            </div>

            {students.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Attendance
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}