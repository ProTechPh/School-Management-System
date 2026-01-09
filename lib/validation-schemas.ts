import { z } from "zod"

/**
 * Centralized validation schemas for API endpoints
 * Prevents injection attacks and ensures data integrity
 */

// Lesson schemas
export const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  classId: z.string().uuid(),
  description: z.string().max(5000).optional(),
  content: z.string().max(50000).optional(),
  materials: z.array(z.object({
    name: z.string().max(255),
    type: z.string().max(50),
    url: z.string().url().max(1000),
    size: z.string().max(20),
  })).max(20).optional(),
})

export const updateLessonSchema = createLessonSchema.extend({
  id: z.string().uuid(),
  deletedMaterialIds: z.array(z.string().uuid()).optional(),
})

// Announcement schemas
export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  targetAudience: z.enum(['all', 'students', 'teachers', 'parents']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
})

// Calendar event schemas
export const createCalendarEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  event_type: z.enum(['class', 'exam', 'holiday', 'meeting', 'other']),
  class_id: z.string().uuid().optional(),
  location: z.string().max(200).optional(),
  all_day: z.boolean().optional(),
})

export const updateCalendarEventSchema = createCalendarEventSchema.partial()

// Grade schemas
export const createGradeSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  score: z.number().min(0).max(100),
  maxScore: z.number().min(1).max(100),
  type: z.enum(['quiz', 'exam', 'assignment', 'project', 'participation']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

// Attendance schemas
export const saveAttendanceSchema = z.object({
  records: z.array(z.object({
    studentId: z.string().uuid(),
    classId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['present', 'absent', 'late', 'excused']),
  })).min(1).max(100),
})

// Class schemas
export const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  grade: z.string().max(20),
  section: z.string().max(20),
  subject: z.string().max(100),
  teacher_id: z.string().uuid(),
  room: z.string().max(50).optional(),
  scheduleDays: z.array(z.string()).optional(),
  scheduleTime: z.string().optional(),
})

export const updateClassSchema = createClassSchema.partial().extend({
  schedule: z.string().optional(),
})

// Enrollment schemas
export const enrollStudentSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
})

export const unenrollStudentSchema = z.object({
  enrollmentId: z.string().uuid(),
})

// Parent-child relationship schemas
export const linkParentChildSchema = z.object({
  parentId: z.string().uuid(),
  studentId: z.string().uuid(),
  relationship: z.enum(['father', 'mother', 'guardian', 'other']).optional(),
})

export const unlinkParentChildSchema = z.object({
  parentId: z.string().uuid(),
  studentId: z.string().uuid(),
})

// QR attendance schemas
export const generateQrSchema = z.object({
  sessionId: z.string().uuid(),
})

export const endSessionSchema = z.object({
  sessionId: z.string().uuid(),
})

// Settings schemas
export const updateSettingsSchema = z.object({
  school_name: z.string().max(200).optional(),
  school_address: z.string().max(500).optional(),
  school_phone: z.string().max(20).optional(),
  school_email: z.string().email().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius_meters: z.number().min(1).max(10000).optional(),
})
