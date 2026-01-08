-- Performance Optimization: Add Database Indexes
-- Generated: 2026-01-08
-- Purpose: Improve query performance for frequently accessed columns

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;

-- Attendance records indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_records(class_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- Grades indexes
CREATE INDEX IF NOT EXISTS idx_grades_student_class ON grades(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_date ON grades(class_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_grades_student_date ON grades(student_id, date DESC);

-- Class students (enrollments) indexes
CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);

-- Classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_section ON classes(grade, section);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(sender_id, receiver_id, created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Quizzes indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher_class ON quizzes(teacher_id, class_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_class_created ON quizzes(class_id, created_at DESC);

-- Quiz attempts indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id, completed_at DESC);

-- Lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_class_created ON lessons(class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher ON lessons(teacher_id);

-- Schedules indexes
CREATE INDEX IF NOT EXISTS idx_schedules_class_day ON schedules(class_id, day);
CREATE INDEX IF NOT EXISTS idx_schedules_day_time ON schedules(day, start_time);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_target_created ON announcements(target_audience, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements(author_id, created_at DESC);

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_class_due ON assignments(class_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id, created_at DESC);

-- Assignment submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id, submitted_at DESC);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_target ON calendar_events(target_audience, start_date);

-- Parent-children relationship indexes
CREATE INDEX IF NOT EXISTS idx_parent_children_parent ON parent_children(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_student ON parent_children(student_id);

-- Student profiles indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_grade_section ON student_profiles(grade, section);
CREATE INDEX IF NOT EXISTS idx_student_profiles_lrn ON student_profiles(lrn) WHERE lrn IS NOT NULL;

-- Teacher profiles indexes
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_subject ON teacher_profiles(subject);

-- QR attendance indexes (if tables exist)
CREATE INDEX IF NOT EXISTS idx_qr_sessions_teacher ON qr_attendance_sessions(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_session ON qr_checkins(session_id, checked_in_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_attendance_class_date_status ON attendance_records(class_id, date, status);

-- Add statistics for query planner
ANALYZE users;
ANALYZE attendance_records;
ANALYZE grades;
ANALYZE class_students;
ANALYZE classes;
ANALYZE chat_messages;
ANALYZE notifications;
ANALYZE quizzes;
ANALYZE quiz_attempts;

-- Comment for documentation
COMMENT ON INDEX idx_users_role IS 'Optimizes role-based user queries';
COMMENT ON INDEX idx_attendance_student_date IS 'Optimizes student attendance history queries';
COMMENT ON INDEX idx_grades_student_class IS 'Optimizes grade lookups by student and class';
COMMENT ON INDEX idx_chat_messages_conversation IS 'Optimizes conversation thread queries';
