"use client"

import { create } from "zustand"
import type { AttendanceStatus } from "@/lib/types"
import { calculateAttendanceStats, type AttendanceStats } from "@/lib/attendance-utils"

export interface GradeTrend {
  date: string
  grade: number
  subject: string
  type: string
}

export interface AttendanceTrend {
  date: string
  status: AttendanceStatus
}

export interface SubjectPerformance {
  subject: string
  average: number
  highest: number
  lowest: number
  count: number
}

export interface StudentAnalytics {
  studentId: string
  gradeTrends: GradeTrend[]
  attendanceTrends: AttendanceTrend[]
  subjectPerformance: SubjectPerformance[]
  overallAverage: number
  attendanceRate: number
  improvementRate: number
}

// No mock data - data comes from database via API

interface AnalyticsStore {
  studentAnalytics: Record<string, StudentAnalytics>
  
  getStudentAnalytics: (studentId: string) => StudentAnalytics | undefined
  getGradeTrendsBySubject: (studentId: string, subject: string) => GradeTrend[]
  getAttendanceStats: (studentId: string) => AttendanceStats
  getClassAverages: (classId: string, studentIds: string[]) => { average: number; highest: number; lowest: number }
}

export const useAnalyticsStore = create<AnalyticsStore>((_set, get) => ({
  studentAnalytics: {},

  getStudentAnalytics: (studentId) => {
    return get().studentAnalytics[studentId]
  },

  getGradeTrendsBySubject: (studentId, subject) => {
    const analytics = get().studentAnalytics[studentId]
    if (!analytics) return []
    return analytics.gradeTrends.filter((t) => t.subject === subject)
  },

  getAttendanceStats: (studentId) => {
    const analytics = get().studentAnalytics[studentId]
    if (!analytics) return { present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: 0 }
    
    return calculateAttendanceStats(analytics.attendanceTrends)
  },

  getClassAverages: (_classId, studentIds) => {
    const allAnalytics = get().studentAnalytics
    const averages = studentIds
      .map((id) => allAnalytics[id]?.overallAverage)
      .filter((avg): avg is number => avg !== undefined)
    
    if (averages.length === 0) return { average: 0, highest: 0, lowest: 0 }
    
    return {
      average: Math.round(averages.reduce((a, b) => a + b, 0) / averages.length),
      highest: Math.max(...averages),
      lowest: Math.min(...averages),
    }
  },
}))
