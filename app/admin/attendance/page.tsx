"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  class_id: string
  class_name: string
  date: string
  status: "present" | "absent" | "late" | "excused"
}

interface ClassInfo {
  id: string
  name: string
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
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

    // Securely fetch attendance via API
    try {
      const response = await fetch("/api/admin/attendance")
      if (response.ok) {
        const { attendance } = await response.json()
        setRecords(attendance.map((r: any) => ({
          id: r.id,
          student_id: r.student_id,
          student_name: r.student?.name || "Unknown",
          class_id: r.class_id,
          class_name: r.class?.name || "Unknown",
          date: r.date,
          status: r.status,
        })))
      }
    } catch (error) {
      console.error("Failed to fetch attendance", error)
    }

    const { data: classData } = await supabase
      .from("classes")
      .select("id, name")
      .order("name")

    if (classData) setClasses(classData)

    setLoading(false)
  }

  const filteredRecords = records.filter((record) => {
    const matchesClass = filterClass === "all" || record.class_id === filterClass
    const matchesStatus = filterStatus === "all" || record.status === filterStatus
    return matchesClass && matchesStatus
  })

  const statusColors = {
    present: "default" as const,
    absent: "destructive" as const,
    late: "secondary" as const,
    excused: "outline" as const,
  }

  const columns = [
    {
      key: "studentName",
      header: "Student",
      render: (record: AttendanceRecord) => (
        <span className="font-medium text-card-foreground">{record.student_name}</span>
      ),
    },
    {
      key: "classId",
      header: "Class",
      render: (record: AttendanceRecord) => (
        <span className="text-sm text-muted-foreground">{record.class_name}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (record: AttendanceRecord) => (
        <span className="text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString()}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (record: AttendanceRecord) => (
        <Badge variant={statusColors[record.status]} className="capitalize">
          {record.status}
        </Badge>
      ),
    },
  ]

  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter((r) => r.status === "present").length,
    absent: filteredRecords.filter((r) => r.status === "absent").length,
    late: filteredRecords.filter((r) => r.status === "late").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Attendance" subtitle="Track and manage student attendance" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Attendance" subtitle="Track and manage student attendance" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Present</p>
            <p className="text-2xl font-bold text-primary">{stats.present}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Late</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.late}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
            </PopoverContent>
          </Popover>

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

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="excused">Excused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable columns={columns} data={filteredRecords} />
      </div>
    </div>
  )
}