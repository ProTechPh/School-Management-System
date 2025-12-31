"use client"

import { create } from "zustand"

export interface QRAttendanceSession {
  id: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  date: string
  startTime: string
  endTime: string
  qrCode: string
  status: "active" | "expired"
  checkedInStudents: string[]
  requireLocation: boolean
}

interface QRAttendanceStore {
  sessions: QRAttendanceSession[]
  createSession: (
    session: Omit<QRAttendanceSession, "id" | "qrCode" | "status" | "checkedInStudents">,
  ) => QRAttendanceSession
  checkIn: (sessionId: string, studentId: string, locationVerified?: boolean) => { success: boolean; message: string }
  endSession: (sessionId: string) => void
  getActiveSession: (classId: string) => QRAttendanceSession | undefined
  getSessionByQRCode: (qrCode: string) => QRAttendanceSession | undefined
  getTeacherSessions: (teacherId: string) => QRAttendanceSession[]
}

export const useQRAttendanceStore = create<QRAttendanceStore>((set, get) => ({
  sessions: [],

  createSession: (session) => {
    const qrCode = `ATT-${session.classId.toUpperCase()}-${session.date.replace(/-/g, "")}-${session.startTime.replace(":", "")}`
    const newSession: QRAttendanceSession = {
      ...session,
      id: `qr${Date.now()}`,
      qrCode,
      status: "active",
      checkedInStudents: [],
    }
    set((state) => ({
      sessions: [newSession, ...state.sessions],
    }))
    return newSession
  },

  checkIn: (sessionId, studentId, locationVerified = true) => {
    const { sessions } = get()
    const session = sessions.find((s) => s.id === sessionId)

    if (!session) {
      return { success: false, message: "Session not found" }
    }

    if (session.status === "expired") {
      return { success: false, message: "This attendance session has expired" }
    }

    if (session.checkedInStudents.includes(studentId)) {
      return { success: false, message: "You have already checked in" }
    }

    // Check if location is required but not verified
    if (session.requireLocation && !locationVerified) {
      return { success: false, message: "Location verification required. Please enable location services and be within school area." }
    }

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, checkedInStudents: [...s.checkedInStudents, studentId] } : s,
      ),
    }))

    return { success: true, message: "Successfully checked in!" }
  },

  endSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, status: "expired" } : s)),
    }))
  },

  getActiveSession: (classId) => {
    const { sessions } = get()
    return sessions.find((s) => s.classId === classId && s.status === "active")
  },

  getSessionByQRCode: (qrCode) => {
    const { sessions } = get()
    return sessions.find((s) => s.qrCode === qrCode)
  },

  getTeacherSessions: (teacherId) => {
    const { sessions } = get()
    return sessions.filter((s) => s.teacherId === teacherId)
  },
}))
