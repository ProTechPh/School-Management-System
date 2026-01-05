"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Download, Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { UserRole } from "@/lib/types"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: string
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  all_day: boolean
  location?: string
  class?: { id: string; name: string }
  target_audience: string
}

interface CalendarViewProps {
  userId: string
  userRole: UserRole
  classIds?: string[]
  canCreate?: boolean
}

const eventTypeColors: Record<string, string> = {
  class: "bg-blue-500", quiz: "bg-amber-500", assignment: "bg-purple-500",
  exam: "bg-red-500", holiday: "bg-green-500", meeting: "bg-violet-500", other: "bg-gray-500",
}

export function CalendarView({ userRole, canCreate = false }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newEvent, setNewEvent] = useState({ 
    title: "", 
    description: "", 
    type: "other", 
    startDate: "", 
    endDate: "", 
    startTime: "", 
    endTime: "", 
    allDay: false, 
    location: "", 
    targetAudience: "personal" 
  })

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const startDate = format(startOfMonth(subMonths(currentDate, 1)), "yyyy-MM-dd")
      const endDate = format(endOfMonth(addMonths(currentDate, 1)), "yyyy-MM-dd")
      const response = await fetch(`/api/calendar?startDate=${startDate}&endDate=${endDate}`)
      
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to load events")
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
      toast.error("Failed to load calendar events")
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const calendarDays = useMemo(() => {
    const days: Date[] = []
    let day = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    while (day <= end) { days.push(day); day = addDays(day, 1) }
    return days
  }, [currentDate])

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return events.filter((e) => {
      const eventStart = new Date(e.start_date)
      const eventEnd = e.end_date ? new Date(e.end_date) : eventStart
      const targetDate = new Date(dateStr)
      return targetDate >= eventStart && targetDate <= eventEnd
    })
  }

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.startDate) return
    
    setSaving(true)
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          type: newEvent.type,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate || null,
          startTime: newEvent.startTime || null,
          endTime: newEvent.endTime || null,
          allDay: newEvent.allDay,
          location: newEvent.location || null,
          targetAudience: newEvent.targetAudience,
        }),
      })

      if (response.ok) {
        toast.success("Event created")
        setShowEventDialog(false)
        setNewEvent({
          title: "",
          description: "",
          type: "other",
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
          allDay: false,
          location: "",
          targetAudience: "personal",
        })
        fetchEvents()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to create event")
      }
    } catch (error) {
      console.error("Failed to create event:", error)
      toast.error("Failed to create event")
    } finally {
      setSaving(false)
    }
  }

  const formatICalDate = (date: string, time?: string): string => {
    const d = new Date(date)
    if (time) {
      const [h, m] = time.split(":")
      d.setHours(parseInt(h), parseInt(m))
    }
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }

  const handleExportEvent = (event: CalendarEvent) => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `UID:${event.id}@edumanager`,
      `DTSTAMP:${formatICalDate(new Date().toISOString().split("T")[0])}`,
      `DTSTART:${formatICalDate(event.start_date, event.start_time || undefined)}`,
    ]

    if (event.end_date || event.end_time) {
      lines.push(`DTEND:${formatICalDate(event.end_date || event.start_date, event.end_time || undefined)}`)
    }

    lines.push(`SUMMARY:${event.title}`)
    
    if (event.description) {
      lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`)
    }
    
    if (event.location) {
      lines.push(`LOCATION:${event.location}`)
    }

    lines.push("END:VEVENT", "END:VCALENDAR")

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${event.title.replace(/\s+/g, "_")}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
            {canCreate && (
              <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Event</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Title</Label>
                      <Input
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Event title"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select
                          value={newEvent.type}
                          onValueChange={(v) => setNewEvent({ ...newEvent, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="class">Class</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="exam">Exam</SelectItem>
                            <SelectItem value="holiday">Holiday</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Audience</Label>
                        <Select
                          value={newEvent.targetAudience}
                          onValueChange={(v) => setNewEvent({ ...newEvent, targetAudience: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="all">Everyone</SelectItem>
                            {userRole !== "student" && (
                              <SelectItem value="students">Students</SelectItem>
                            )}
                            {userRole === "admin" && (
                              <SelectItem value="teachers">Teachers</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={newEvent.startDate}
                          onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={newEvent.endDate}
                          onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newEvent.allDay}
                        onCheckedChange={(checked) => setNewEvent({ ...newEvent, allDay: checked })}
                      />
                      <Label>All day event</Label>
                    </div>
                    
                    {!newEvent.allDay && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={newEvent.startTime}
                            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={newEvent.endTime}
                            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label>Location</Label>
                      <Input
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder="Room or location"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Event details"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateEvent}
                      disabled={saving || !newEvent.title || !newEvent.startDate}
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="bg-muted/50 p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[80px] p-1 text-left bg-card hover:bg-muted/50 transition-colors",
                    !isSameMonth(day, currentDate) && "text-muted-foreground/50",
                    isToday(day) && "bg-primary/5",
                    isSelected && "ring-2 ring-primary ring-inset"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                      isToday(day) && "bg-primary text-primary-foreground font-semibold"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-xs text-white",
                          eventTypeColors[event.type] || eventTypeColors.other
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader><CardTitle className="text-base font-semibold">{selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}</CardTitle></CardHeader>
        <CardContent>
          {selectedDate ? (
            selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">
                            {event.type}
                          </Badge>
                          {event.class?.name && (
                            <span className="text-xs text-muted-foreground">
                              {event.class.name}
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-card-foreground truncate">
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => handleExportEvent(event)}
                        title="Export to calendar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {!event.all_day && event.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.start_time}
                          {event.end_time && ` - ${event.end_time}`}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No events scheduled for this day
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Click on a date to view events
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
