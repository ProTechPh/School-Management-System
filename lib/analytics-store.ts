"use client"

import { create } from "zustand"
import type { AttendanceStatus } from "@/lib/types"

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
  getAttendanceStats: (studentId: string) => { present: number; absent: number; late: number; excused: number; rate: number }
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
    if (!analytics) return { present: 0, absent: 0, late: 0, excused: 0, rate: 0 }
    
    const trends = analytics.attendanceTrends
    const present = trends.filter((t) => t.status === "present").length
    const absent = trends.filter((t) => t.status === "absent").length
    const late = trends.filter((t) => t.status === "late").length
    const excused = trends.filter((t) => t.status === "excused").length
    const total = trends.length
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    
    return { present, absent, late, excused, rate }
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
