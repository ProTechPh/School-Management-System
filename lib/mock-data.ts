// Mock data for the School Management System

export type UserRole = "admin" | "teacher" | "student"

export interface Student {
  id: string
  name: string
  email: string
  grade: string
  section: string
  enrollmentDate: string
  avatar: string
  parentName: string
  parentPhone: string
  address: string
}

export interface Teacher {
  id: string
  name: string
  email: string
  subject: string
  phone: string
  avatar: string
  department: string
  joinDate: string
  address?: string // Add optional address field
}

export interface Class {
  id: string
  name: string
  grade: string
  section: string
  teacherId: string
  teacherName: string
  subject: string
  schedule: string
  room: string
  studentCount: number
}

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  classId: string
}

export interface Grade {
  id: string
  studentId: string
  studentName: string
  classId: string
  className: string
  subject: string
  score: number
  maxScore: number
  grade: number // Philippine grade (60-100)
  percentage: number // Raw percentage score
  date: string
  type: "exam" | "quiz" | "assignment" | "project"
}

export interface GradeHistory {
  id: string
  studentId: string
  studentName: string
  schoolYear: string
  gradeLevel: string
  subjects: {
    subject: string
    finalGrade: number
    remarks: string
  }[]
  generalAverage: number
  remarks: string
  promotedDate: string
}

export interface ScheduleItem {
  id: string
  classId: string
  className: string
  subject: string
  teacherName: string
  day: string
  startTime: string
  endTime: string
  room: string
}

// New interfaces for Quiz, Lesson, and Notification
export interface QuizReopenEntry {
  studentId: string
  studentName: string
  reason: string
  newDueDate: string
  reopenedAt: string
}

export interface Quiz {
  id: string
  title: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  description: string
  duration: number // in minutes
  totalQuestions: number
  questions: QuizQuestion[]
  dueDate: string
  status: "draft" | "published" | "closed"
  createdAt: string
  reopenedFor?: QuizReopenEntry[] // Students who can still take the quiz after due date
}

export type QuestionType = "multiple-choice" | "true-false" | "identification" | "essay"

export interface QuizQuestion {
  id: string
  type: QuestionType
  question: string
  options?: string[] // For multiple-choice and true-false
  correctAnswer?: number | string // number for multiple-choice/true-false, string for identification
  points: number
  caseSensitive?: boolean // For identification questions
}

export interface QuizAnswer {
  questionId: string
  answer: number | string // number for multiple-choice/true-false, string for identification/essay
  isCorrect?: boolean // For auto-graded questions
  manualScore?: number // For essay questions (teacher graded)
}

export interface QuizAttempt {
  id: string
  quizId: string
  studentId: string
  studentName: string
  answers: QuizAnswer[]
  score: number
  maxScore: number
  percentage: number
  completedAt: string
  needsGrading?: boolean // True if has essay questions pending review
}

export interface Lesson {
  id: string
  title: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  description: string
  content: string
  materials: LessonMaterial[]
  createdAt: string
  updatedAt: string
}

export interface LessonMaterial {
  id: string
  name: string
  type: "pdf" | "video" | "link" | "document"
  url: string
  size?: string
}

export interface Notification {
  id: string
  userId: string
  userRole: UserRole
  title: string
  message: string
  type:
    | "info"
    | "success"
    | "warning"
    | "assignment"
    | "grade"
    | "attendance"
    | "quiz"
    | "lesson"
    | "announcement"
    | "chat"
  read: boolean
  link?: string
  createdAt: string
}

// New interfaces for Announcement, Chat, and QR Attendance
export interface Announcement {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  authorRole: UserRole
  targetAudience: "all" | "students" | "teachers" | "grade-10" | "grade-11" | "grade-12"
  priority: "normal" | "important" | "urgent"
  createdAt: string
  expiresAt?: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: UserRole
  senderAvatar: string
  receiverId: string
  receiverName: string
  receiverRole: UserRole
  content: string
  createdAt: string
  read: boolean
}

export interface ChatConversation {
  id: string
  participants: {
    id: string
    name: string
    role: UserRole
    avatar: string
  }[]
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

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
  requireLocation: boolean // Whether location check is required for this session
}

// Students data
export const students: Student[] = [
  {
    id: "s1",
    name: "Emma Wilson",
    email: "emma.wilson@school.edu",
    grade: "10",
    section: "A",
    enrollmentDate: "2023-09-01",
    avatar: "/diverse-student-girl.png",
    parentName: "John Wilson",
    parentPhone: "(555) 123-4567",
    address: "123 Oak Street",
  },
  {
    id: "s2",
    name: "Liam Johnson",
    email: "liam.johnson@school.edu",
    grade: "10",
    section: "A",
    enrollmentDate: "2023-09-01",
    avatar: "/student-boy.png",
    parentName: "Sarah Johnson",
    parentPhone: "(555) 234-5678",
    address: "456 Maple Ave",
  },
  {
    id: "s3",
    name: "Olivia Brown",
    email: "olivia.brown@school.edu",
    grade: "10",
    section: "B",
    enrollmentDate: "2023-09-01",
    avatar: "/student-girl-brunette.jpg",
    parentName: "Michael Brown",
    parentPhone: "(555) 345-6789",
    address: "789 Pine Road",
  },
  {
    id: "s4",
    name: "Noah Davis",
    email: "noah.davis@school.edu",
    grade: "11",
    section: "A",
    enrollmentDate: "2022-09-01",
    avatar: "/student-boy-glasses.png",
    parentName: "Emily Davis",
    parentPhone: "(555) 456-7890",
    address: "321 Cedar Lane",
  },
  {
    id: "s5",
    name: "Ava Martinez",
    email: "ava.martinez@school.edu",
    grade: "11",
    section: "A",
    enrollmentDate: "2022-09-01",
    avatar: "/student-girl-blonde.jpg",
    parentName: "Carlos Martinez",
    parentPhone: "(555) 567-8901",
    address: "654 Birch Street",
  },
  {
    id: "s6",
    name: "Ethan Garcia",
    email: "ethan.garcia@school.edu",
    grade: "11",
    section: "B",
    enrollmentDate: "2022-09-01",
    avatar: "/student-boy-curly.jpg",
    parentName: "Maria Garcia",
    parentPhone: "(555) 678-9012",
    address: "987 Elm Ave",
  },
  {
    id: "s7",
    name: "Sophia Anderson",
    email: "sophia.anderson@school.edu",
    grade: "12",
    section: "A",
    enrollmentDate: "2021-09-01",
    avatar: "/student-girl-redhead.jpg",
    parentName: "David Anderson",
    parentPhone: "(555) 789-0123",
    address: "147 Walnut Road",
  },
  {
    id: "s8",
    name: "Mason Thomas",
    email: "mason.thomas@school.edu",
    grade: "12",
    section: "A",
    enrollmentDate: "2021-09-01",
    avatar: "/student-boy-athletic.jpg",
    parentName: "Jennifer Thomas",
    parentPhone: "(555) 890-1234",
    address: "258 Cherry Lane",
  },
]

// Teachers data
export const teachers: Teacher[] = [
  {
    id: "t1",
    name: "Dr. Sarah Miller",
    email: "sarah.miller@school.edu",
    subject: "Mathematics",
    phone: "(555) 111-2222",
    avatar: "/teacher-woman-professional.jpg",
    department: "Mathematics",
    joinDate: "2018-08-15",
    address: "123 Oak Street",
  },
  {
    id: "t2",
    name: "Mr. James Chen",
    email: "james.chen@school.edu",
    subject: "Physics",
    phone: "(555) 222-3333",
    avatar: "/teacher-man-asian.jpg",
    department: "Science",
    joinDate: "2019-08-15",
    address: "456 Maple Ave",
  },
  {
    id: "t3",
    name: "Ms. Emily Rodriguez",
    email: "emily.rodriguez@school.edu",
    subject: "English",
    phone: "(555) 333-4444",
    avatar: "/teacher-woman-latina.jpg",
    department: "Languages",
    joinDate: "2020-08-15",
    address: "789 Pine Road",
  },
  {
    id: "t4",
    name: "Mr. David Kim",
    email: "david.kim@school.edu",
    subject: "History",
    phone: "(555) 444-5555",
    avatar: "/teacher-man-korean.jpg",
    department: "Social Studies",
    joinDate: "2017-08-15",
    address: "321 Cedar Lane",
  },
  {
    id: "t5",
    name: "Dr. Lisa Thompson",
    email: "lisa.thompson@school.edu",
    subject: "Chemistry",
    phone: "(555) 555-6666",
    avatar: "/teacher-woman-scientist.jpg",
    department: "Science",
    joinDate: "2016-08-15",
    address: "654 Birch Street",
  },
]

// Classes data
export const classes: Class[] = [
  {
    id: "c1",
    name: "Algebra II",
    grade: "10",
    section: "A",
    teacherId: "t1",
    teacherName: "Dr. Sarah Miller",
    subject: "Mathematics",
    schedule: "Mon, Wed, Fri - 9:00 AM",
    room: "Room 101",
    studentCount: 25,
  },
  {
    id: "c2",
    name: "Physics 101",
    grade: "11",
    section: "A",
    teacherId: "t2",
    teacherName: "Mr. James Chen",
    subject: "Physics",
    schedule: "Tue, Thu - 10:30 AM",
    room: "Lab 201",
    studentCount: 22,
  },
  {
    id: "c3",
    name: "English Literature",
    grade: "10",
    section: "B",
    teacherId: "t3",
    teacherName: "Ms. Emily Rodriguez",
    subject: "English",
    schedule: "Mon, Wed, Fri - 11:00 AM",
    room: "Room 105",
    studentCount: 28,
  },
  {
    id: "c4",
    name: "World History",
    grade: "11",
    section: "B",
    teacherId: "t4",
    teacherName: "Mr. David Kim",
    subject: "History",
    schedule: "Tue, Thu - 1:00 PM",
    room: "Room 203",
    studentCount: 24,
  },
  {
    id: "c5",
    name: "Chemistry Advanced",
    grade: "12",
    section: "A",
    teacherId: "t5",
    teacherName: "Dr. Lisa Thompson",
    subject: "Chemistry",
    schedule: "Mon, Wed, Fri - 2:00 PM",
    room: "Lab 301",
    studentCount: 20,
  },
  {
    id: "c6",
    name: "Calculus",
    grade: "12",
    section: "A",
    teacherId: "t1",
    teacherName: "Dr. Sarah Miller",
    subject: "Mathematics",
    schedule: "Tue, Thu - 9:00 AM",
    room: "Room 102",
    studentCount: 18,
  },
]

// Attendance records
export const attendanceRecords: AttendanceRecord[] = [
  { id: "a1", studentId: "s1", studentName: "Emma Wilson", date: "2024-12-18", status: "present", classId: "c1" },
  { id: "a2", studentId: "s2", studentName: "Liam Johnson", date: "2024-12-18", status: "present", classId: "c1" },
  { id: "a3", studentId: "s3", studentName: "Olivia Brown", date: "2024-12-18", status: "late", classId: "c3" },
  { id: "a4", studentId: "s4", studentName: "Noah Davis", date: "2024-12-18", status: "present", classId: "c2" },
  { id: "a5", studentId: "s5", studentName: "Ava Martinez", date: "2024-12-18", status: "absent", classId: "c2" },
  { id: "a6", studentId: "s6", studentName: "Ethan Garcia", date: "2024-12-18", status: "present", classId: "c4" },
  { id: "a7", studentId: "s7", studentName: "Sophia Anderson", date: "2024-12-18", status: "present", classId: "c5" },
  { id: "a8", studentId: "s8", studentName: "Mason Thomas", date: "2024-12-18", status: "excused", classId: "c5" },
  { id: "a9", studentId: "s1", studentName: "Emma Wilson", date: "2024-12-17", status: "present", classId: "c1" },
  { id: "a10", studentId: "s2", studentName: "Liam Johnson", date: "2024-12-17", status: "absent", classId: "c1" },
]

// Grades data
export const grades: Grade[] = [
  {
    id: "g1",
    studentId: "s1",
    studentName: "Emma Wilson",
    classId: "c1",
    className: "Algebra II",
    subject: "Mathematics",
    score: 92,
    maxScore: 100,
    percentage: 92,
    grade: 97,
    date: "2024-12-15",
    type: "exam",
  },
  {
    id: "g2",
    studentId: "s1",
    studentName: "Emma Wilson",
    classId: "c3",
    className: "English Literature",
    subject: "English",
    score: 88,
    maxScore: 100,
    percentage: 88,
    grade: 92,
    date: "2024-12-10",
    type: "assignment",
  },
  {
    id: "g3",
    studentId: "s2",
    studentName: "Liam Johnson",
    classId: "c1",
    className: "Algebra II",
    subject: "Mathematics",
    score: 78,
    maxScore: 100,
    percentage: 78,
    grade: 85,
    date: "2024-12-15",
    type: "exam",
  },
  {
    id: "g4",
    studentId: "s4",
    studentName: "Noah Davis",
    classId: "c2",
    className: "Physics 101",
    subject: "Physics",
    score: 95,
    maxScore: 100,
    percentage: 95,
    grade: 98,
    date: "2024-12-14",
    type: "quiz",
  },
  {
    id: "g5",
    studentId: "s5",
    studentName: "Ava Martinez",
    classId: "c2",
    className: "Physics 101",
    subject: "Physics",
    score: 85,
    maxScore: 100,
    percentage: 85,
    grade: 92,
    date: "2024-12-14",
    type: "quiz",
  },
  {
    id: "g6",
    studentId: "s7",
    studentName: "Sophia Anderson",
    classId: "c5",
    className: "Chemistry Advanced",
    subject: "Chemistry",
    score: 70,
    maxScore: 100,
    percentage: 70,
    grade: 77,
    date: "2024-12-13",
    type: "project",
  },
  {
    id: "g7",
    studentId: "s3",
    studentName: "Olivia Brown",
    classId: "c4",
    className: "World History",
    subject: "History",
    score: 98,
    maxScore: 100,
    percentage: 98,
    grade: 99,
    date: "2024-12-12",
    type: "exam",
  },
  {
    id: "g8",
    studentId: "s6",
    studentName: "Isabella Garcia",
    classId: "c6",
    className: "Computer Science",
    subject: "Computer Science",
    score: 60,
    maxScore: 100,
    percentage: 60,
    grade: 73,
    date: "2024-12-11",
    type: "assignment",
  },
  {
    id: "g9",
    studentId: "s8",
    studentName: "James Taylor",
    classId: "c1",
    className: "Algebra II",
    subject: "Mathematics",
    score: 45,
    maxScore: 100,
    percentage: 45,
    grade: 68,
    date: "2024-12-15",
    type: "exam",
  },
  {
    id: "g10",
    studentId: "s1",
    studentName: "Emma Wilson",
    classId: "c1",
    className: "Algebra II",
    subject: "Mathematics",
    score: 100,
    maxScore: 100,
    percentage: 100,
    grade: 100,
    date: "2024-12-17",
    type: "quiz",
  },
  {
    id: "g11",
    studentId: "s2",
    studentName: "Liam Johnson",
    classId: "c1",
    className: "Algebra II",
    subject: "Mathematics",
    score: 80,
    maxScore: 100,
    percentage: 80,
    grade: 88,
    date: "2024-12-17",
    type: "quiz",
  },
]

// Grade history data
export const gradeHistories: GradeHistory[] = [
  {
    id: "gh1",
    studentId: "s1",
    studentName: "Emma Wilson",
    schoolYear: "2022-2023",
    gradeLevel: "10",
    subjects: [
      { subject: "Mathematics", finalGrade: 95, remarks: "Excellent" },
      { subject: "English", finalGrade: 90, remarks: "Good" },
      { subject: "Science", finalGrade: 88, remarks: "Very Good" },
    ],
    generalAverage: 91,
    remarks: "Promoted to Grade 11",
    promotedDate: "2023-06-01",
  },
  {
    id: "gh2",
    studentId: "s2",
    studentName: "Liam Johnson",
    schoolYear: "2022-2023",
    gradeLevel: "10",
    subjects: [
      { subject: "Mathematics", finalGrade: 85, remarks: "Good" },
      { subject: "English", finalGrade: 80, remarks: "Satisfactory" },
      { subject: "Science", finalGrade: 82, remarks: "Good" },
    ],
    generalAverage: 82,
    remarks: "Promoted to Grade 11",
    promotedDate: "2023-06-01",
  },
]

// Schedule data
export const scheduleItems: ScheduleItem[] = [
  {
    id: "sch1",
    classId: "c1",
    className: "Algebra II",
    subject: "Mathematics",
    teacherName: "Dr. Sarah Miller",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    room: "Room 101",
  },
  {
    id: "sch2",
    classId: "c2",
    className: "Physics 101",
    subject: "Physics",
    teacherName: "Mr. James Chen",
    day: "Monday",
    startTime: "10:30",
    endTime: "11:30",
    room: "Lab 201",
  },
  {
    id: "sch3",
    classId: "c3",
    className: "English Literature",
    subject: "English",
    teacherName: "Ms. Emily Rodriguez",
    day: "Monday",
    startTime: "11:00",
    endTime: "12:00",
    room: "Room 105",
  },
  {
    id: "sch4",
    classId: "c4",
    className: "World History",
    subject: "History",
    teacherName: "Mr. David Kim",
    day: "Monday",
    startTime: "13:00",
    endTime: "14:00",
    room: "Room 203",
  },
  {
    id: "sch5",
    classId: "c5",
    className: "Chemistry Advanced",
    subject: "Chemistry",
    teacherName: "Dr. Lisa Thompson",
    day: "Monday",
    startTime: "14:00",
    endTime: "15:00",
    room: "Lab 301",
  },
  {
    id: "sch6",
    classId: "c6",
    className: "Calculus",
    subject: "Mathematics",
    teacherName: "Dr. Sarah Miller",
    day: "Tuesday",
    startTime: "09:00",
    endTime: "10:00",
    room: "Room 102",
  },
  {
    id: "sch7",
    classId: "c2",
    className: "Physics 101",
    subject: "Physics",
    teacherName: "Mr. James Chen",
    day: "Tuesday",
    startTime: "10:30",
    endTime: "11:30",
    room: "Lab 201",
  },
  {
    id: "sch8",
    classId: "c4",
    className: "World History",
    subject: "History",
    teacherName: "Mr. David Kim",
    day: "Tuesday",
    startTime: "13:00",
    endTime: "14:00",
    room: "Room 203",
  },
  {
    id: "sch9",
    classId: "c1",
    className: "Algebra II",
    subject: "Mathematics",
    teacherName: "Dr. Sarah Miller",
    day: "Wednesday",
    startTime: "09:00",
    endTime: "10:00",
    room: "Room 101",
  },
  {
    id: "sch10",
    classId: "c3",
    className: "English Literature",
    subject: "English",
    teacherName: "Ms. Emily Rodriguez",
    day: "Wednesday",
    startTime: "11:00",
    endTime: "12:00",
    room: "Room 105",
  },
  {
    id: "sch11",
    classId: "c5",
    className: "Chemistry Advanced",
    subject: "Chemistry",
    teacherName: "Dr. Lisa Thompson",
    day: "Wednesday",
    startTime: "14:00",
    endTime: "15:00",
    room: "Lab 301",
  },
  {
    id: "sch12",
    classId: "c6",
    className: "Calculus",
    subject: "Mathematics",
    teacherName: "Dr. Sarah Miller",
    day: "Thursday",
    startTime: "09:00",
    endTime: "10:00",
    room: "Room 102",
  },
  {
    id: "sch13",
    classId: "c2",
    className: "Physics 101",
    subject: "Physics",
    teacherName: "Mr. James Chen",
    day: "Thursday",
    startTime: "10:30",
    endTime: "11:30",
    room: "Lab 201",
  },
  {
    id: "sch14",
    classId: "c4",
    className: "World History",
    subject: "History",
    teacherName: "Mr. David Kim",
    day: "Thursday",
    startTime: "13:00",
    endTime: "14:00",
    room: "Room 203",
  },
  {
    id: "sch15",
    classId: "c1",
    className: "Algebra II",
    subject: "Mathematics",
    teacherName: "Dr. Sarah Miller",
    day: "Friday",
    startTime: "09:00",
    endTime: "10:00",
    room: "Room 101",
  },
  {
    id: "sch16",
    classId: "c3",
    className: "English Literature",
    subject: "English",
    teacherName: "Ms. Emily Rodriguez",
    day: "Friday",
    startTime: "11:00",
    endTime: "12:00",
    room: "Room 105",
  },
  {
    id: "sch17",
    classId: "c5",
    className: "Chemistry Advanced",
    subject: "Chemistry",
    teacherName: "Dr. Lisa Thompson",
    day: "Friday",
    startTime: "14:00",
    endTime: "15:00",
    room: "Lab 301",
  },
]

// Quizzes data
export const quizzes: Quiz[] = [
  {
    id: "q1",
    title: "Algebra II - Mid-term Quiz",
    classId: "c1",
    className: "Algebra II",
    teacherId: "t1",
    teacherName: "Dr. Sarah Miller",
    description: "Test your understanding of quadratic equations and functions",
    duration: 30,
    totalQuestions: 5,
    questions: [
      {
        id: "qq1",
        question: "What is the solution to x² - 4 = 0?",
        options: ["x = 2", "x = ±2", "x = 4", "x = ±4"],
        correctAnswer: 1,
        points: 20,
      },
      {
        id: "qq2",
        question: "Which of the following is a quadratic equation?",
        options: ["2x + 3 = 0", "x² + 2x + 1 = 0", "x³ - 1 = 0", "1/x = 2"],
        correctAnswer: 1,
        points: 20,
      },
      {
        id: "qq3",
        question: "The vertex form of a parabola is:",
        options: ["y = ax² + bx + c", "y = a(x-h)² + k", "y = mx + b", "y = ax³ + bx²"],
        correctAnswer: 1,
        points: 20,
      },
      {
        id: "qq4",
        question: "What is the discriminant formula?",
        options: ["b² - 4ac", "b² + 4ac", "-b ± √(b²-4ac)", "2a"],
        correctAnswer: 0,
        points: 20,
      },
      {
        id: "qq5",
        question: "If the discriminant is negative, the equation has:",
        options: ["Two real roots", "One real root", "No real roots", "Infinite roots"],
        correctAnswer: 2,
        points: 20,
      },
    ],
    dueDate: "2024-12-25",
    status: "published",
    createdAt: "2024-12-15",
  },
  {
    id: "q2",
    title: "Physics 101 - Newton's Laws",
    classId: "c2",
    className: "Physics 101",
    teacherId: "t2",
    teacherName: "Mr. James Chen",
    description: "Quiz on Newton's three laws of motion",
    duration: 20,
    totalQuestions: 4,
    questions: [
      {
        id: "qq6",
        question: "Newton's First Law is also known as the law of:",
        options: ["Acceleration", "Inertia", "Action-Reaction", "Gravity"],
        correctAnswer: 1,
        points: 25,
      },
      {
        id: "qq7",
        question: "The formula F = ma represents which law?",
        options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
        correctAnswer: 1,
        points: 25,
      },
      {
        id: "qq8",
        question: "According to Newton's Third Law, forces always come in:",
        options: ["Singles", "Pairs", "Triples", "Quadruples"],
        correctAnswer: 1,
        points: 25,
      },
      {
        id: "qq9",
        question: "What is the SI unit of force?",
        options: ["Joule", "Watt", "Newton", "Pascal"],
        correctAnswer: 2,
        points: 25,
      },
    ],
    dueDate: "2024-12-23",
    status: "published",
    createdAt: "2024-12-14",
  },
  {
    id: "q3",
    title: "English Literature - Shakespeare",
    classId: "c3",
    className: "English Literature",
    teacherId: "t3",
    teacherName: "Ms. Emily Rodriguez",
    description: "Test your knowledge of Shakespeare's works",
    duration: 25,
    totalQuestions: 4,
    questions: [
      {
        id: "qq10",
        question: "Which play features the characters Romeo and Juliet?",
        options: ["Hamlet", "Romeo and Juliet", "Macbeth", "Othello"],
        correctAnswer: 1,
        points: 25,
      },
      {
        id: "qq11",
        question: "'To be or not to be' is from which play?",
        options: ["King Lear", "Macbeth", "Hamlet", "The Tempest"],
        correctAnswer: 2,
        points: 25,
      },
      {
        id: "qq12",
        question: "What type of play is 'A Midsummer Night's Dream'?",
        options: ["Tragedy", "History", "Comedy", "Romance"],
        correctAnswer: 2,
        points: 25,
      },
      {
        id: "qq13",
        question: "How many sonnets did Shakespeare write?",
        options: ["100", "154", "200", "50"],
        correctAnswer: 1,
        points: 25,
      },
    ],
    dueDate: "2024-12-28",
    status: "published",
    createdAt: "2024-12-16",
  },
]

// Quiz attempts
export const quizAttempts: QuizAttempt[] = [
  {
    id: "qa1",
    quizId: "q1",
    studentId: "s1",
    studentName: "Emma Wilson",
    answers: [1, 1, 1, 0, 2],
    score: 100,
    maxScore: 100,
    percentage: 100,
    completedAt: "2024-12-17",
  },
  {
    id: "qa2",
    quizId: "q1",
    studentId: "s2",
    studentName: "Liam Johnson",
    answers: [1, 1, 0, 0, 1],
    score: 80,
    maxScore: 100,
    percentage: 80,
    completedAt: "2024-12-17",
  },
]

// Lessons data
export const lessons: Lesson[] = [
  {
    id: "l1",
    title: "Introduction to Quadratic Equations",
    classId: "c1",
    className: "Algebra II",
    teacherId: "t1",
    teacherName: "Dr. Sarah Miller",
    description: "Learn the fundamentals of quadratic equations and their applications",
    content:
      "A quadratic equation is a second-degree polynomial equation in a single variable. The general form is ax² + bx + c = 0, where a ≠ 0. In this lesson, we will explore the different methods to solve quadratic equations including factoring, completing the square, and the quadratic formula.",
    materials: [
      {
        id: "m1",
        name: "Quadratic Equations Guide.pdf",
        type: "pdf",
        url: "/materials/quadratic-guide.pdf",
        size: "2.4 MB",
      },
      {
        id: "m2",
        name: "Video Lecture - Solving Quadratics",
        type: "video",
        url: "/materials/quadratic-video.mp4",
        size: "45 MB",
      },
    ],
    createdAt: "2024-12-10",
    updatedAt: "2024-12-15",
  },
  {
    id: "l2",
    title: "Newton's Laws of Motion",
    classId: "c2",
    className: "Physics 101",
    teacherId: "t2",
    teacherName: "Mr. James Chen",
    description: "Understanding the three fundamental laws that govern motion",
    content:
      "Sir Isaac Newton's three laws of motion describe the relationship between a body and the forces acting upon it, and its motion in response to those forces. These laws laid the foundation for classical mechanics.",
    materials: [
      { id: "m3", name: "Newton's Laws Summary.pdf", type: "pdf", url: "/materials/newtons-laws.pdf", size: "1.8 MB" },
      { id: "m4", name: "Motion Demonstrations", type: "video", url: "/materials/motion-demo.mp4", size: "120 MB" },
      { id: "m5", name: "Practice Problems", type: "document", url: "/materials/practice.docx", size: "500 KB" },
    ],
    createdAt: "2024-12-08",
    updatedAt: "2024-12-14",
  },
  {
    id: "l3",
    title: "Shakespeare's Tragedies",
    classId: "c3",
    className: "English Literature",
    teacherId: "t3",
    teacherName: "Ms. Emily Rodriguez",
    description: "Exploring the major tragedies written by William Shakespeare",
    content:
      "William Shakespeare wrote some of the most famous tragedies in English literature. His major tragedies include Hamlet, Othello, King Lear, and Macbeth. These plays explore themes of ambition, jealousy, betrayal, and the human condition.",
    materials: [
      {
        id: "m6",
        name: "Tragedy Analysis Guide.pdf",
        type: "pdf",
        url: "/materials/tragedy-guide.pdf",
        size: "3.2 MB",
      },
      { id: "m7", name: "Hamlet Act 1 Recording", type: "video", url: "/materials/hamlet-act1.mp4", size: "200 MB" },
    ],
    createdAt: "2024-12-12",
    updatedAt: "2024-12-16",
  },
  {
    id: "l4",
    title: "The French Revolution",
    classId: "c4",
    className: "World History",
    teacherId: "t4",
    teacherName: "Mr. David Kim",
    description: "Understanding the causes and effects of the French Revolution",
    content:
      "The French Revolution (1789-1799) was a period of radical political and societal change in France. It began with the Estates General of 1789 and ended with the formation of the French Consulate in November 1799.",
    materials: [
      {
        id: "m8",
        name: "French Revolution Timeline.pdf",
        type: "pdf",
        url: "/materials/french-rev.pdf",
        size: "4.1 MB",
      },
    ],
    createdAt: "2024-12-11",
    updatedAt: "2024-12-13",
  },
]

// Notifications data
export const notifications: Notification[] = [
  {
    id: "n1",
    userId: "s1",
    userRole: "student",
    title: "New Quiz Available",
    message: "A new quiz 'Algebra II - Mid-term Quiz' has been published for your class",
    type: "quiz",
    read: false,
    link: "/student/quizzes",
    createdAt: "2024-12-18T10:30:00",
  },
  {
    id: "n2",
    userId: "s1",
    userRole: "student",
    title: "Grade Posted",
    message: "Your grade for 'Algebra II' exam has been posted. You scored 92/100",
    type: "grade",
    read: false,
    link: "/student/grades",
    createdAt: "2024-12-17T14:20:00",
  },
  {
    id: "n3",
    userId: "s1",
    userRole: "student",
    title: "New Lesson Available",
    message: "A new lesson 'Introduction to Quadratic Equations' has been added",
    type: "lesson",
    read: true,
    link: "/student/lessons",
    createdAt: "2024-12-15T09:00:00",
  },
  {
    id: "n4",
    userId: "t1",
    userRole: "teacher",
    title: "Quiz Submission",
    message: "Emma Wilson has completed 'Algebra II - Mid-term Quiz' with 100% score",
    type: "quiz",
    read: false,
    link: "/teacher/quizzes",
    createdAt: "2024-12-17T16:45:00",
  },
  {
    id: "n5",
    userId: "t1",
    userRole: "teacher",
    title: "Low Attendance Alert",
    message: "Attendance for Algebra II class is below 85% today",
    type: "attendance",
    read: false,
    link: "/teacher/attendance",
    createdAt: "2024-12-18T11:00:00",
  },
  {
    id: "n6",
    userId: "admin",
    userRole: "admin",
    title: "System Update",
    message: "The school management system will undergo maintenance on Dec 20",
    type: "info",
    read: false,
    createdAt: "2024-12-18T08:00:00",
  },
  {
    id: "n7",
    userId: "admin",
    userRole: "admin",
    title: "New Teacher Registration",
    message: "A new teacher registration request needs approval",
    type: "info",
    read: false,
    link: "/admin/teachers",
    createdAt: "2024-12-17T10:30:00",
  },
  {
    id: "n8",
    userId: "s2",
    userRole: "student",
    title: "Attendance Marked",
    message: "You were marked as absent for Physics 101 on Dec 17",
    type: "attendance",
    read: false,
    link: "/student/attendance",
    createdAt: "2024-12-17T15:00:00",
  },
]

// Mock announcements
export const announcements: Announcement[] = [
  {
    id: "ann1",
    title: "Winter Break Schedule",
    content:
      "School will be closed from December 23rd to January 3rd for winter break. Classes will resume on January 4th. Please ensure all assignments are submitted before the break.",
    authorId: "admin",
    authorName: "School Administration",
    authorRole: "admin",
    targetAudience: "all",
    priority: "important",
    createdAt: "2024-12-18T09:00:00Z",
    expiresAt: "2025-01-04T00:00:00Z",
  },
  {
    id: "ann2",
    title: "Science Fair Registration Open",
    content:
      "Registration for the annual Science Fair is now open! Students interested in participating should submit their project proposals by January 15th. Contact Dr. Lisa Thompson for more information.",
    authorId: "t5",
    authorName: "Dr. Lisa Thompson",
    authorRole: "teacher",
    targetAudience: "students",
    priority: "normal",
    createdAt: "2024-12-17T14:30:00Z",
  },
  {
    id: "ann3",
    title: "Grade 12 College Application Workshop",
    content:
      "Attention Grade 12 students! A mandatory college application workshop will be held on December 20th at 2:00 PM in the auditorium. Please bring your laptops.",
    authorId: "admin",
    authorName: "School Administration",
    authorRole: "admin",
    targetAudience: "grade-12",
    priority: "urgent",
    createdAt: "2024-12-16T10:00:00Z",
  },
  {
    id: "ann4",
    title: "Staff Meeting Reminder",
    content:
      "Reminder: All teachers are required to attend the end-of-semester staff meeting on December 19th at 4:00 PM in Conference Room A.",
    authorId: "admin",
    authorName: "School Administration",
    authorRole: "admin",
    targetAudience: "teachers",
    priority: "normal",
    createdAt: "2024-12-15T08:00:00Z",
  },
]

// Mock chat messages
export const chatMessages: ChatMessage[] = [
  {
    id: "msg1",
    senderId: "t1",
    senderName: "Dr. Sarah Miller",
    senderRole: "teacher",
    senderAvatar: "/teacher-woman-professional.jpg",
    receiverId: "s1",
    receiverName: "Emma Wilson",
    receiverRole: "student",
    content: "Great job on your last math quiz! Keep up the excellent work.",
    createdAt: "2024-12-18T10:30:00Z",
    read: true,
  },
  {
    id: "msg2",
    senderId: "s1",
    senderName: "Emma Wilson",
    senderRole: "student",
    senderAvatar: "/diverse-student-girl.png",
    receiverId: "t1",
    receiverName: "Dr. Sarah Miller",
    receiverRole: "teacher",
    content: "Thank you, Dr. Miller! I studied really hard for it.",
    createdAt: "2024-12-18T10:35:00Z",
    read: true,
  },
  {
    id: "msg3",
    senderId: "t2",
    senderName: "Mr. James Chen",
    senderRole: "teacher",
    senderAvatar: "/teacher-man-asian.jpg",
    receiverId: "s4",
    receiverName: "Noah Davis",
    receiverRole: "student",
    content: "Don't forget to submit your physics lab report by Friday.",
    createdAt: "2024-12-18T09:15:00Z",
    read: false,
  },
  {
    id: "msg4",
    senderId: "admin",
    senderName: "Admin",
    senderRole: "admin",
    senderAvatar: "/placeholder.svg",
    receiverId: "t1",
    receiverName: "Dr. Sarah Miller",
    receiverRole: "teacher",
    content: "Please submit your grade reports by end of day Friday.",
    createdAt: "2024-12-17T16:00:00Z",
    read: true,
  },
]

// Mock QR attendance sessions
export const qrAttendanceSessions: QRAttendanceSession[] = [
  {
    id: "qr1",
    classId: "c1",
    className: "Algebra II",
    teacherId: "t1",
    teacherName: "Dr. Sarah Miller",
    date: "2024-12-19",
    startTime: "09:00",
    endTime: "10:00",
    qrCode: "ATT-C1-20241219-0900",
    status: "active",
    checkedInStudents: ["s1", "s2"],
  },
]

// Dashboard stats
export const dashboardStats = {
  totalStudents: 245,
  totalTeachers: 32,
  totalClasses: 48,
  attendanceRate: 94.5,
  averageGrade: 85.2,
}
