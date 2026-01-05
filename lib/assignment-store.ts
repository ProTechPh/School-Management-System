"use client"

import { create } from "zustand"
import type { AssignmentStatus, SubmissionStatus } from "@/lib/types"

// Re-export for backward compatibility
export type { AssignmentStatus, SubmissionStatus }

export interface Assignment {
  id: string
  title: string
  description: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  dueDate: string
  maxScore: number
  allowLateSubmission: boolean
  attachments: AssignmentAttachment[]
  status: AssignmentStatus
  createdAt: string
}

export interface AssignmentAttachment {
  id: string
  name: string
  type: "pdf" | "document" | "image" | "link"
  url: string
  size?: string
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  studentId: string
  studentName: string
  submittedAt: string
  status: SubmissionStatus
  files: SubmissionFile[]
  comment?: string
  score?: number
  feedback?: string
  gradedAt?: string
  gradedBy?: string
}

export interface SubmissionFile {
  id: string
  name: string
  type: string
  url: string
  size: string
}

// No mock data - data comes from database via API

interface AssignmentStore {
  assignments: Assignment[]
  submissions: AssignmentSubmission[]
  
  // Assignment actions
  createAssignment: (assignment: Omit<Assignment, "id" | "createdAt">) => void
  updateAssignment: (id: string, updates: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
  
  // Submission actions
  submitAssignment: (submission: Omit<AssignmentSubmission, "id" | "submittedAt" | "status">) => void
  gradeSubmission: (submissionId: string, score: number, feedback: string, gradedBy: string) => void
  
  // Queries
  getAssignmentsByClass: (classId: string) => Assignment[]
  getAssignmentsByTeacher: (teacherId: string) => Assignment[]
  getAssignmentsForStudent: (studentId: string, classIds: string[]) => Assignment[]
  getSubmissionsByAssignment: (assignmentId: string) => AssignmentSubmission[]
  getStudentSubmission: (assignmentId: string, studentId: string) => AssignmentSubmission | undefined
  getPendingGradingCount: (teacherId: string) => number
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  submissions: [],

  createAssignment: (assignment) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split("T")[0],
    }
    set((state) => ({
      assignments: [...state.assignments, newAssignment],
    }))
  },

  updateAssignment: (id, updates) => {
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }))
  },

  deleteAssignment: (id) => {
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== id),
      submissions: state.submissions.filter((s) => s.assignmentId !== id),
    }))
  },

  submitAssignment: (submission) => {
    const assignment = get().assignments.find((a) => a.id === submission.assignmentId)
    const isLate = assignment && new Date() > new Date(assignment.dueDate)
    
    const newSubmission: AssignmentSubmission = {
      ...submission,
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      status: isLate ? "late" : "submitted",
    }
    set((state) => ({
      submissions: [...state.submissions, newSubmission],
    }))
  },

  gradeSubmission: (submissionId, score, feedback, gradedBy) => {
    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              score,
              feedback,
              gradedBy,
              gradedAt: new Date().toISOString(),
              status: "graded" as SubmissionStatus,
            }
          : s
      ),
    }))
  },

  getAssignmentsByClass: (classId) => {
    return get().assignments.filter((a) => a.classId === classId)
  },

  getAssignmentsByTeacher: (teacherId) => {
    return get().assignments.filter((a) => a.teacherId === teacherId)
  },

  getAssignmentsForStudent: (_studentId, classIds) => {
    return get().assignments.filter(
      (a) => classIds.includes(a.classId) && a.status === "published"
    )
  },

  getSubmissionsByAssignment: (assignmentId) => {
    return get().submissions.filter((s) => s.assignmentId === assignmentId)
  },

  getStudentSubmission: (assignmentId, studentId) => {
    return get().submissions.find(
      (s) => s.assignmentId === assignmentId && s.studentId === studentId
    )
  },

  getPendingGradingCount: (teacherId) => {
    const teacherAssignments = get().assignments.filter((a) => a.teacherId === teacherId)
    const assignmentIds = teacherAssignments.map((a) => a.id)
    return get().submissions.filter(
      (s) => assignmentIds.includes(s.assignmentId) && s.status === "submitted"
    ).length
  },
}))
