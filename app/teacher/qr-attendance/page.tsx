"use client"

import type React from "react"
import { useState, useEffect, useRef, lazy, Suspense } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { QrCode, Plus, Users, Clock, StopCircle, MapPin, Loader2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"

// Lazy load QR code generator for better initial bundle size
const QRCodeGenerator = lazy(() => import("@/components/qr-code-generator").then(mod => ({ default: mod.QRCodeGenerator })))

// Accessible loading fallback for QR code
const QRLoadingFallback = () => (
  <div 
    className="flex items-center justify-center w-[250px] h-[250px]"
    role="status"
    aria-live="polite"
    aria-label="Loading QR code"
  >
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="sr-only">Loading QR code for attendance</span>
  </div>
)

interface TeacherClass {
  id: string
  name: string
  subject: string
}

interface QRSession {
  id: string
  class_id: string
  class_name: string
  teacher_id: string
  date: string
  start_time: string
  end_time: string | null
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
  const [currentQRData, setCurrentQRData] = useState<string>("")
  const [qrError, setQrError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [formData, setFormData] = useState({
    classId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: format(new Date(), "HH:mm"),
    endTime: "",
    requireLocation: true,
  })
  
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 3

  useEffect(() => {
    fetchData()
    return () => {
      if (rotationIntervalRef.current) clearInterval(rotationIntervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (selectedSessionId) {
      updateQRCode()
      // Security Fix: Rotate QR code every 3 seconds (was 5s)
      rotationIntervalRef.current = setInterval(updateQRCode, 3000)
    } else {
      if (rotationIntervalRef.current) clearInterval(rotationIntervalRef.current)
    }
    return () => {
      if (rotationIntervalRef.current) clearInterval(rotationIntervalRef.current)
    }
  }, [selectedSessionId])

  const updateQRCode = async () => {
    if (!selectedSessionId) return
    
    try {
      const response = await fetch("/api/teacher/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSessionId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate QR code" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.token) {
        throw new Error("No QR token received from server")
      }

      setCurrentQRData(data.token)
      setQrError(null)
      setRetryCount(0)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("[QR Generation] Failed to generate QR token:", errorMessage)
      setQrError(errorMessage)
      
      // Retry logic for transient failures
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1)
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
        setTimeout(() => updateQRCode(), delay)
      } else {
        toast.error("Failed to generate QR code", { 
          description: "Please try ending and restarting the session" 
        })
      }
    }
  }

  const fetchData = async () => {
    const supabase = createClient()
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("[QR Attendance] Auth error:", authError)
        toast.error("Authentication error", { description: "Please log in again" })
        setLoading(false)
        return
      }

      if (!user) {
        toast.error("Not authenticated", { description: "Please log in to continue" })
        setLoading(false)
        return
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name")
        .eq("id", user.id)
        .single()
      
      if (userError) {
        console.error("[QR Attendance] User fetch error:", userError)
        toast.error("Failed to load user data")
      } else if (userData) {
        setCurrentTeacher(userData)
      }

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id, name, subject")
        .eq("teacher_id", user.id)
        .order("name")

      if (classError) {
        console.error("[QR Attendance] Classes fetch error:", classError)
        toast.error("Failed to load classes")
      } else if (classData) {
        setTeacherClasses(classData)
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from("qr_attendance_sessions")
        .select(`
          id, class_id, teacher_id, date, start_time, end_time, status, require_location,
          class:classes (name),
          checkins:qr_checkins (student_id)
        `)
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false })

      if (sessionError) {
        console.error("[QR Attendance] Sessions fetch error:", sessionError)
        toast.error("Failed to load sessions")
      } else if (sessionData) {
        setSessions(sessionData.map(s => ({
          ...s,
          class_name: (s.class as any)?.name || "Unknown"
        })))
      }
    } catch (error) {
      console.error("[QR Attendance] Unexpected error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentTeacher) {
      toast.error("Teacher information not loaded")
      return
    }
    
    if (!formData.classId) {
      toast.error("Please select a class")
      return
    }

    const selectedClass = teacherClasses.find((c) => c.id === formData.classId)
    if (!selectedClass) {
      toast.error("Selected class not found")
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("qr_attendance_sessions")
        .insert({
          class_id: formData.classId,
          teacher_id: currentTeacher.id,
          date: formData.date,
          start_time: formData.startTime,
          end_time: formData.endTime || null,
          qr_code: "dynamic", 
          status: "active",
          require_location: formData.requireLocation,
        })
        .select()
        .single()

      if (error) {
        console.error("[QR Attendance] Session creation error:", error)
        toast.error("Failed to create session", { description: error.message })
        return
      }

      if (!data) {
        toast.error("No data returned from session creation")
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
    } catch (error) {
      console.error("[QR Attendance] Unexpected error creating session:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleEndSession = async (sessionId: string) => {
    if (!sessionId) {
      toast.error("Invalid session ID")
      return
    }

    try {
      const response = await fetch("/api/teacher/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to end session" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: "expired" as const } : s
      ))
      setSelectedSessionId(null)
      setQrError(null)
      setRetryCount(0)
      toast.success("Session ended")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("[QR Attendance] End session error:", errorMessage)
      toast.error("Failed to end session", { description: errorMessage })
    }
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
        subtitle="Generate rotating QR codes for secure attendance"
        userId={currentTeacher?.id}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Dynamic Attendance QR
            </CardTitle>
            <CardDescription>
              This QR code updates automatically every 3 seconds to prevent sharing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {activeSession && activeSession.status === "active" ? (
              <>
                <div 
                  className="relative"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {qrError ? (
                    <div className="flex flex-col items-center justify-center w-[250px] h-[250px] border-2 border-dashed border-destructive rounded-lg">
                      <p className="text-sm text-destructive text-center px-4">
                        Failed to generate QR code
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setRetryCount(0)
                          updateQRCode()
                        }}
                        className="mt-2"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : currentQRData ? (
                    <Suspense fallback={<QRLoadingFallback />}>
                      <QRCodeGenerator data={currentQRData} size={250} />
                    </Suspense>
                  ) : (
                    <QRLoadingFallback />
                  )}
                  {!qrError && (
                    <div className="absolute top-2 right-2" aria-hidden="true">
                      <RefreshCw className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="font-semibold text-lg">{activeSession.class_name}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {activeSession.start_time}
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
              <div 
                className="flex flex-col items-center gap-4 py-8 text-center"
                role="status"
                aria-label="No active session"
              >
                <div 
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-muted"
                  aria-hidden="true"
                >
                  <QrCode className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No active attendance session. Start a new session to generate a QR code.</p>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Start New Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Attendance Session</DialogTitle>
                      <DialogDescription id="dialog-description">
                        Set up a new QR code attendance session for your class
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSession} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-class">Class</Label>
                        <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                          <SelectTrigger id="session-class" aria-required="true">
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                          <SelectContent>
                            {teacherClasses.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No classes available
                              </SelectItem>
                            ) : (
                              teacherClasses.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} - {c.subject}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="session-date">Date</Label>
                          <Input 
                            id="session-date"
                            type="date" 
                            value={formData.date} 
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                            aria-required="true"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="session-start-time">Start Time</Label>
                          <Input 
                            id="session-start-time"
                            type="time" 
                            value={formData.startTime} 
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            required
                            aria-required="true"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="session-end-time">
                            End Time <span className="text-muted-foreground text-xs">(optional)</span>
                          </Label>
                          <Input 
                            id="session-end-time"
                            type="time" 
                            value={formData.endTime} 
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            aria-describedby="end-time-hint"
                          />
                          <span id="end-time-hint" className="sr-only">
                            End time is optional. Leave blank for open-ended sessions.
                          </span>
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
            {sessions.length === 0 ? (
              <p 
                className="text-center text-sm text-muted-foreground py-8"
                role="status"
              >
                No attendance sessions yet. Create your first session to get started.
              </p>
            ) : (
              <ul className="space-y-3" role="list" aria-label="Attendance session history">
                {sessions.map((session) => (
                  <li 
                    key={session.id} 
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">{session.class_name}</p>
                      <p className="text-sm text-muted-foreground">
                        <time dateTime={session.date}>
                          {format(new Date(session.date), "MMM d, yyyy")}
                        </time>
                        {" • "}
                        <time dateTime={session.start_time}>{session.start_time}</time>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={session.status === "active" ? "default" : "secondary"}
                        aria-label={`Session status: ${session.status}`}
                      >
                        {session.status}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        aria-label={`${session.checkins?.length || 0} students checked in`}
                      >
                        <Users className="mr-1 h-3 w-3" aria-hidden="true" />
                        {session.checkins?.length || 0}
                      </Badge>
                      {session.status === "active" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedSessionId(session.id)}
                          aria-label={`View active session for ${session.class_name}`}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
