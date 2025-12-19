import { createClient } from "./client"
import type { DbUser, DbStudentProfile, DbTeacherProfile, DbClass, DbSchedule } from "./types"

// User queries
export async function getUsers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("name")
  if (error) throw error
  return data as DbUser[]
}

export async function getUserById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw error
  return data as DbUser
}

export async function getUsersByRole(role: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", role)
    .order("name")
  if (error) throw error
  return data as DbUser[]
}

// Student queries
export async function getStudents() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      student_profiles (*)
    `)
    .eq("role", "student")
    .order("name")
  if (error) throw error
  return data
}

export async function getStudentProfile(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("id", id)
    .single()
  if (error) return null
  return data as DbStudentProfile
}

// Teacher queries
export async function getTeachers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      teacher_profiles (*)
    `)
    .eq("role", "teacher")
    .order("name")
  if (error) throw error
  return data
}

export async function getTeacherProfile(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("id", id)
    .single()
  if (error) return null
  return data as DbTeacherProfile
}

// Class queries
export async function getClasses() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("classes")
    .select(`
      *,
      teacher:users!classes_teacher_id_fkey (id, name, email, avatar)
    `)
    .order("name")
  if (error) throw error
  return data
}

export async function getClassById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("classes")
    .select(`
      *,
      teacher:users!classes_teacher_id_fkey (id, name, email, avatar)
    `)
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

export async function getClassesByTeacher(teacherId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("name")
  if (error) throw error
  return data as DbClass[]
}

export async function getClassStudents(classId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("class_students")
    .select(`
      *,
      student:users!class_students_student_id_fkey (
        id, name, email, avatar,
        student_profiles (grade, section)
      )
    `)
    .eq("class_id", classId)
  if (error) throw error
  return data
}

export async function getStudentClasses(studentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("class_students")
    .select(`
      *,
      class:classes (
        *,
        teacher:users!classes_teacher_id_fkey (id, name)
      )
    `)
    .eq("student_id", studentId)
  if (error) throw error
  return data
}

// Schedule queries
export async function getSchedules() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("schedules")
    .select(`
      *,
      class:classes (
        id, name, subject,
        teacher:users!classes_teacher_id_fkey (name)
      )
    `)
    .order("day")
    .order("start_time")
  if (error) throw error
  return data
}

export async function getSchedulesByClass(classId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("class_id", classId)
    .order("day")
    .order("start_time")
  if (error) throw error
  return data as DbSchedule[]
}

// Attendance queries
export async function getAttendanceRecords(classId?: string, date?: string) {
  const supabase = createClient()
  let query = supabase
    .from("attendance_records")
    .select(`
      *,
      student:users!attendance_records_student_id_fkey (id, name, avatar),
      class:classes (id, name)
    `)
    .order("date", { ascending: false })
  
  if (classId) query = query.eq("class_id", classId)
  if (date) query = query.eq("date", date)
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getStudentAttendance(studentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("attendance_records")
    .select(`
      *,
      class:classes (id, name)
    `)
    .eq("student_id", studentId)
    .order("date", { ascending: false })
  if (error) throw error
  return data
}

// Grade queries
export async function getGrades(classId?: string) {
  const supabase = createClient()
  let query = supabase
    .from("grades")
    .select(`
      *,
      student:users!grades_student_id_fkey (id, name, avatar),
      class:classes (id, name, subject)
    `)
    .order("date", { ascending: false })
  
  if (classId) query = query.eq("class_id", classId)
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getStudentGrades(studentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("grades")
    .select(`
      *,
      class:classes (id, name, subject)
    `)
    .eq("student_id", studentId)
    .order("date", { ascending: false })
  if (error) throw error
  return data
}

// Quiz queries
export async function getQuizzes(classId?: string) {
  const supabase = createClient()
  let query = supabase
    .from("quizzes")
    .select(`
      *,
      class:classes (id, name),
      teacher:users!quizzes_teacher_id_fkey (id, name),
      questions:quiz_questions (*)
    `)
    .order("created_at", { ascending: false })
  
  if (classId) query = query.eq("class_id", classId)
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getQuizById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("quizzes")
    .select(`
      *,
      class:classes (id, name),
      teacher:users!quizzes_teacher_id_fkey (id, name),
      questions:quiz_questions (*),
      reopens:quiz_reopens (
        *,
        student:users!quiz_reopens_student_id_fkey (id, name)
      )
    `)
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

// Lesson queries
export async function getLessons(classId?: string) {
  const supabase = createClient()
  let query = supabase
    .from("lessons")
    .select(`
      *,
      class:classes (id, name),
      teacher:users!lessons_teacher_id_fkey (id, name),
      materials:lesson_materials (*)
    `)
    .order("created_at", { ascending: false })
  
  if (classId) query = query.eq("class_id", classId)
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Announcement queries
export async function getAnnouncements(targetAudience?: string) {
  const supabase = createClient()
  let query = supabase
    .from("announcements")
    .select(`
      *,
      author:users!announcements_author_id_fkey (id, name, role)
    `)
    .order("created_at", { ascending: false })
  
  if (targetAudience && targetAudience !== "all") {
    query = query.or(`target_audience.eq.all,target_audience.eq.${targetAudience}`)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Notification queries
export async function getNotifications(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

// Chat queries
export async function getChatMessages(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("chat_messages")
    .select(`
      *,
      sender:users!chat_messages_sender_id_fkey (id, name, role, avatar),
      receiver:users!chat_messages_receiver_id_fkey (id, name, role, avatar)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

// School settings
export async function getSchoolSettings() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("school_settings")
    .select("*")
    .single()
  if (error) return null
  return data
}

// Quiz attempts queries
export async function getQuizAttempts(quizId?: string) {
  const supabase = createClient()
  let query = supabase
    .from("quiz_attempts")
    .select(`
      *,
      student:users!quiz_attempts_student_id_fkey (id, name, avatar),
      quiz:quizzes (id, title, class_id)
    `)
    .order("completed_at", { ascending: false })
  
  if (quizId) query = query.eq("quiz_id", quizId)
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getQuizzesByTeacher(teacherId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("quizzes")
    .select(`
      *,
      class:classes (id, name, grade, section),
      questions:quiz_questions (*),
      reopens:quiz_reopens (
        *,
        student:users!quiz_reopens_student_id_fkey (id, name)
      )
    `)
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

// QR Attendance
export async function getQrSessions(teacherId?: string) {
  const supabase = createClient()
  let query = supabase
    .from("qr_attendance_sessions")
    .select(`
      *,
      class:classes (id, name),
      checkins:qr_checkins (
        *,
        student:users!qr_checkins_student_id_fkey (id, name)
      )
    `)
    .order("created_at", { ascending: false })
  
  if (teacherId) query = query.eq("teacher_id", teacherId)
  
  const { data, error } = await query
  if (error) throw error
  return data
}
