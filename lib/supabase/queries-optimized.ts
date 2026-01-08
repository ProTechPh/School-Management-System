/**
 * Optimized Supabase queries with pagination, caching, and performance improvements
 * Use these instead of the original queries.ts for better performance
 */

import { createClient } from "./client"
import type { DbUser, DbStudentProfile, DbTeacherProfile, DbClass, DbSchedule } from "./types"

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// USER QUERIES (Optimized)
// ============================================================================

export async function getUsers(params: PaginationParams = {}) {
  const { page = 1, pageSize = 50 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = createClient()
  const { data, error, count } = await supabase
    .from("users")
    .select("*", { count: "exact" })
    .order("name")
    .range(from, to)

  if (error) throw error

  return {
    data: data as DbUser[],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  }
}

export async function getUsersByRole(role: string, params: PaginationParams = {}) {
  const { page = 1, pageSize = 50 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = createClient()
  const { data, error, count } = await supabase
    .from("users")
    .select("*", { count: "exact" })
    .eq("role", role)
    .order("name")
    .range(from, to)

  if (error) throw error

  return {
    data: data as DbUser[],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  }
}

// ============================================================================
// STUDENT QUERIES (Optimized)
// ============================================================================

export async function getStudents(params: PaginationParams = {}) {
  const { page = 1, pageSize = 50 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = createClient()
  const { data, error, count } = await supabase
    .from("users")
    .select(
      `
      *,
      student_profiles (*)
    `,
      { count: "exact" }
    )
    .eq("role", "student")
    .order("name")
    .range(from, to)

  if (error) throw error

  return {
    data,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  }
}

// ============================================================================
// CLASS QUERIES (Optimized with aggregations)
// ============================================================================

export async function getClassesWithCounts() {
  const supabase = createClient()
  
  // Single query with aggregation instead of N+1
  const { data, error } = await supabase
    .from("classes")
    .select(`
      id, name, grade, section, subject, room, schedule, teacher_id,
      teacher:users!classes_teacher_id_fkey (id, name, email, avatar),
      enrollments:class_students(count)
    `)
    .order("name")

  if (error) throw error

  // Transform to include student_count
  return data?.map((c: any) => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    section: c.section,
    subject: c.subject,
    room: c.room,
    schedule: c.schedule,
    teacher_id: c.teacher_id,
    teacher: c.teacher,
    student_count: c.enrollments?.[0]?.count || 0,
  }))
}

export async function getClassStudentsOptimized(classId: string) {
  const supabase = createClient()
  
  // Optimized: Single query with proper joins
  const { data, error } = await supabase
    .from("class_students")
    .select(`
      enrolled_at,
      student:users!class_students_student_id_fkey (
        id, name, email, avatar,
        student_profiles (grade, section, lrn)
      )
    `)
    .eq("class_id", classId)
    .order("enrolled_at", { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// ATTENDANCE QUERIES (Optimized with date range)
// ============================================================================

export async function getAttendanceRecordsOptimized(
  classId?: string,
  startDate?: string,
  endDate?: string,
  limit = 100
) {
  const supabase = createClient()
  
  let query = supabase
    .from("attendance_records")
    .select(`
      id, date, status, created_at,
      student:users!attendance_records_student_id_fkey (id, name, avatar),
      class:classes (id, name)
    `)
    .order("date", { ascending: false })
    .limit(limit)

  if (classId) query = query.eq("class_id", classId)
  if (startDate) query = query.gte("date", startDate)
  if (endDate) query = query.lte("date", endDate)

  const { data, error } = await query
  if (error) throw error
  return data
}

// ============================================================================
// GRADE QUERIES (Optimized)
// ============================================================================

export async function getGradesOptimized(
  classId?: string,
  studentId?: string,
  limit = 100
) {
  const supabase = createClient()
  
  let query = supabase
    .from("grades")
    .select(`
      id, score, max_score, percentage, grade, type, date,
      student:users!grades_student_id_fkey (id, name, avatar),
      class:classes (id, name, subject)
    `)
    .order("date", { ascending: false })
    .limit(limit)

  if (classId) query = query.eq("class_id", classId)
  if (studentId) query = query.eq("student_id", studentId)

  const { data, error } = await query
  if (error) throw error
  return data
}

// ============================================================================
// CHAT QUERIES (Optimized with pagination)
// ============================================================================

export async function getChatMessagesOptimized(
  userId: string,
  params: PaginationParams = {}
) {
  const { page = 1, pageSize = 50 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = createClient()
  const { data, error, count } = await supabase
    .from("chat_messages")
    .select(
      `
      id, content, created_at, read, sender_id, receiver_id,
      sender:users!chat_messages_sender_id_fkey (id, name, role, avatar),
      receiver:users!chat_messages_receiver_id_fkey (id, name, role, avatar)
    `,
      { count: "exact" }
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    data,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  }
}

// ============================================================================
// DASHBOARD AGGREGATION QUERIES
// ============================================================================

export async function getDashboardStats(role: string, userId: string) {
  const supabase = createClient()

  if (role === "admin") {
    // Parallel queries for admin dashboard
    const [studentsCount, teachersCount, classesCount, attendanceStats] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("classes").select("id", { count: "exact", head: true }),
      supabase.from("attendance_records").select("status"),
    ])

    const totalRecords = attendanceStats.data?.length || 0
    const presentRecords = attendanceStats.data?.filter((a) => a.status === "present").length || 0
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100 * 10) / 10 : 0

    return {
      totalStudents: studentsCount.count || 0,
      totalTeachers: teachersCount.count || 0,
      totalClasses: classesCount.count || 0,
      attendanceRate,
    }
  }

  if (role === "teacher") {
    // Optimized teacher stats
    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", userId)

    const classIds = classes?.map((c) => c.id) || []

    if (classIds.length === 0) {
      return { totalClasses: 0, totalStudents: 0, attendanceRate: 0 }
    }

    const [studentsCount, attendanceStats] = await Promise.all([
      supabase
        .from("class_students")
        .select("*", { count: "exact", head: true })
        .in("class_id", classIds),
      supabase.from("attendance_records").select("status").in("class_id", classIds),
    ])

    const totalRecords = attendanceStats.data?.length || 0
    const presentRecords =
      attendanceStats.data?.filter((a) => a.status === "present" || a.status === "late").length || 0
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100 * 10) / 10 : 0

    return {
      totalClasses: classIds.length,
      totalStudents: studentsCount.count || 0,
      attendanceRate,
    }
  }

  return null
}

// ============================================================================
// BULK OPERATIONS (Optimized)
// ============================================================================

export async function bulkInsertGrades(grades: any[]) {
  const supabase = createClient()
  const { data, error } = await supabase.from("grades").insert(grades).select()

  if (error) throw error
  return data
}

export async function bulkUpdateAttendance(updates: { id: string; status: string }[]) {
  const supabase = createClient()

  // Use upsert for better performance
  const { data, error } = await supabase
    .from("attendance_records")
    .upsert(updates, { onConflict: "id" })
    .select()

  if (error) throw error
  return data
}
