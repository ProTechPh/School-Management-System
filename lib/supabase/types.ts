// Database types matching Supabase schema
export type UserRole = "admin" | "teacher" | "student"

export interface DbUser {
  id: string
  email: string
  name: string
  role: UserRole
  avatar: string | null
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

// Enrollment status options for DepEd
export type EnrollmentStatus = 'New' | 'Transferee' | 'Balik-Aral' | 'Cross-Enrollee'

// Senior High School tracks
export type SHSTrack = 'Academic' | 'TVL' | 'Sports' | 'Arts and Design'

// Sex options
export type Sex = 'Male' | 'Female'

// Disability types per DepEd requirements
export type DisabilityType = 
  | 'None'
  | 'Visual Impairment'
  | 'Hearing Impairment'
  | 'Learning Disability'
  | 'Intellectual Disability'
  | 'Physical Disability'
  | 'Speech/Language Disorder'
  | 'Autism Spectrum Disorder'
  | 'Multiple Disabilities'
  | 'Others'

export interface DbStudentProfile {
  id: string
  
  // Basic Info (Requirements 1.1-1.6)
  lrn: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  name_extension: string | null
  birthdate: string | null
  sex: Sex | null
  birthplace_city: string | null
  birthplace_province: string | null
  
  // Contact/Address (Requirements 2.1-2.5)
  current_house_street: string | null
  current_barangay: string | null
  current_city: string | null
  current_province: string | null
  current_region: string | null
  permanent_same_as_current: boolean
  permanent_house_street: string | null
  permanent_barangay: string | null
  permanent_city: string | null
  permanent_province: string | null
  permanent_region: string | null
  contact_number: string | null
  email: string | null
  
  // Parent/Guardian (Requirements 3.1-3.5)
  father_name: string | null
  father_contact: string | null
  father_occupation: string | null
  mother_name: string | null
  mother_contact: string | null
  mother_occupation: string | null
  guardian_name: string | null
  guardian_relationship: string | null
  guardian_contact: string | null
  
  // Academic (Requirements 4.1-4.7)
  grade: string
  section: string
  school_year: string | null
  enrollment_status: EnrollmentStatus | null
  last_school_attended: string | null
  last_school_year: string | null
  track: SHSTrack | null
  strand: string | null
  enrollment_date: string | null
  
  // DepEd Required (Requirements 5.1-5.7)
  psa_birth_cert_no: string | null
  is_4ps_beneficiary: boolean
  household_4ps_id: string | null
  is_indigenous: boolean
  indigenous_group: string | null
  mother_tongue: string | null
  religion: string | null
  
  // Health/Special Needs (Requirements 6.1-6.5)
  disability_type: DisabilityType | null
  disability_details: string | null
  emergency_contact_name: string | null
  emergency_contact_number: string | null
  blood_type: string | null
  medical_conditions: string | null
}

export interface DbTeacherProfile {
  id: string
  subject: string
  department: string | null
  join_date: string | null
}

export interface DbClass {
  id: string
  name: string
  grade: string
  section: string
  teacher_id: string | null
  subject: string
  schedule: string | null
  room: string | null
  created_at: string
}

export interface DbAttendanceRecord {
  id: string
  student_id: string | null
  class_id: string | null
  date: string
  status: "present" | "absent" | "late" | "excused"
  created_at: string
}

export interface DbGrade {
  id: string
  student_id: string | null
  class_id: string | null
  score: number
  max_score: number
  percentage: number
  grade: number
  type: "exam" | "quiz" | "assignment" | "project"
  date: string
  created_at: string
}

export interface DbSchedule {
  id: string
  class_id: string | null
  day: string
  start_time: string
  end_time: string
  room: string | null
}

export interface DbQuiz {
  id: string
  title: string
  class_id: string | null
  teacher_id: string | null
  description: string | null
  duration: number
  due_date: string | null
  status: "draft" | "published" | "closed"
  created_at: string
}

export interface DbQuizQuestion {
  id: string
  quiz_id: string | null
  type: "multiple-choice" | "true-false" | "identification" | "essay"
  question: string
  options: string[] | null
  correct_answer: string | null
  points: number
  case_sensitive: boolean
  sort_order: number
}

export interface DbLesson {
  id: string
  title: string
  class_id: string | null
  teacher_id: string | null
  description: string | null
  content: string | null
  created_at: string
  updated_at: string
}

export interface DbLessonMaterial {
  id: string
  lesson_id: string | null
  name: string
  type: "pdf" | "video" | "link" | "document"
  url: string
  size: string | null
}

export interface DbAnnouncement {
  id: string
  title: string
  content: string
  author_id: string | null
  target_audience: "all" | "students" | "teachers" | "grade-10" | "grade-11" | "grade-12"
  priority: "normal" | "important" | "urgent"
  expires_at: string | null
  created_at: string
}

export interface DbChatMessage {
  id: string
  sender_id: string | null
  receiver_id: string | null
  content: string
  read: boolean
  created_at: string
}

export interface DbNotification {
  id: string
  user_id: string | null
  title: string
  message: string
  type: "info" | "success" | "warning" | "assignment" | "grade" | "attendance" | "quiz" | "lesson" | "announcement" | "chat"
  read: boolean
  link: string | null
  created_at: string
}

export interface DbQrAttendanceSession {
  id: string
  class_id: string | null
  teacher_id: string | null
  date: string
  start_time: string
  end_time: string | null
  qr_code: string
  status: "active" | "expired"
  require_location: boolean
  created_at: string
}

export interface DbSchoolSettings {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  radius_meters: number
  updated_at: string
}

export interface DbAuditLogEntry {
  id: string
  user_id: string | null
  action: string
  ip_address: string | null
  created_at: string
  payload: any
}
