/**
 * Shared type definitions for the application
 */

export type UserRole = "admin" | "teacher" | "student" | "parent"

export type AttendanceStatus = "present" | "absent" | "late" | "excused"

export type AssignmentStatus = "draft" | "published" | "closed"

export type SubmissionStatus = "pending" | "submitted" | "graded" | "late"

export type EventType = "class" | "quiz" | "assignment" | "exam" | "holiday" | "meeting" | "other"

export type TargetAudience = "all" | "students" | "teachers" | "class" | "personal"

export type ParentRelationship = "mother" | "father" | "guardian" | "other"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  is_active: boolean
  created_at: string
}
