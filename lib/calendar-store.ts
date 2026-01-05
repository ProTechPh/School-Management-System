"use client"

import { create } from "zustand"

export type EventType = "class" | "quiz" | "assignment" | "exam" | "holiday" | "meeting" | "other"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: EventType
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  allDay: boolean
  location?: string
  classId?: string
  className?: string
  createdBy: string
  createdByRole: "admin" | "teacher" | "student"
  targetAudience: "all" | "students" | "teachers" | "class" | "personal"
  color?: string
}

// No mock data - data comes from database via API

interface CalendarStore {
  events: CalendarEvent[]
  
  // Event actions
  addEvent: (event: Omit<CalendarEvent, "id">) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  
  // Queries
  getEventsForDate: (date: string) => CalendarEvent[]
  getEventsForDateRange: (startDate: string, endDate: string) => CalendarEvent[]
  getEventsForUser: (userId: string, userRole: "admin" | "teacher" | "student", classIds?: string[]) => CalendarEvent[]
  getUpcomingEvents: (userId: string, userRole: "admin" | "teacher" | "student", classIds?: string[], limit?: number) => CalendarEvent[]
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],

  addEvent: (event) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
    }
    set((state) => ({
      events: [...state.events, newEvent],
    }))
  },

  updateEvent: (id, updates) => {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }))
  },

  deleteEvent: (id) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    }))
  },

  getEventsForDate: (date) => {
    return get().events.filter((e) => {
      const eventStart = new Date(e.startDate)
      const eventEnd = e.endDate ? new Date(e.endDate) : eventStart
      const targetDate = new Date(date)
      return targetDate >= eventStart && targetDate <= eventEnd
    })
  },

  getEventsForDateRange: (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return get().events.filter((e) => {
      const eventStart = new Date(e.startDate)
      const eventEnd = e.endDate ? new Date(e.endDate) : eventStart
      return eventStart <= end && eventEnd >= start
    })
  },

  getEventsForUser: (userId, userRole, classIds = []) => {
    return get().events.filter((e) => {
      // All events visible to everyone
      if (e.targetAudience === "all") return true
      
      // Personal events
      if (e.targetAudience === "personal" && e.createdBy === userId) return true
      
      // Role-based events
      if (e.targetAudience === "teachers" && userRole === "teacher") return true
      if (e.targetAudience === "students" && userRole === "student") return true
      
      // Class-specific events
      if (e.targetAudience === "class" && e.classId && classIds.includes(e.classId)) return true
      
      // Admin sees everything
      if (userRole === "admin") return true
      
      return false
    })
  },

  getUpcomingEvents: (userId, userRole, classIds = [], limit = 5) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return get()
      .getEventsForUser(userId, userRole, classIds)
      .filter((e) => new Date(e.startDate) >= today)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit)
  },
}))

// Helper to generate iCal format
export function generateICalEvent(event: CalendarEvent): string {
  const formatDate = (date: string, time?: string) => {
    const d = new Date(date)
    if (time) {
      const [hours, minutes] = time.split(":")
      d.setHours(parseInt(hours), parseInt(minutes))
    }
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EduManager//Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@edumanager`,
    `DTSTAMP:${formatDate(new Date().toISOString().split("T")[0])}`,
    `DTSTART:${formatDate(event.startDate, event.startTime)}`,
  ]

  if (event.endDate || event.endTime) {
    lines.push(`DTEND:${formatDate(event.endDate || event.startDate, event.endTime)}`)
  }

  lines.push(`SUMMARY:${event.title}`)
  
  if (event.description) {
    lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`)
  }
  
  if (event.location) {
    lines.push(`LOCATION:${event.location}`)
  }

  lines.push("END:VEVENT", "END:VCALENDAR")
  
  return lines.join("\r\n")
}
