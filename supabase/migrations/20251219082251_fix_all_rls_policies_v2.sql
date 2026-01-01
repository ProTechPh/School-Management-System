-- Drop existing restrictive policies and create permissive ones

-- Classes
DROP POLICY IF EXISTS "Authenticated can read classes" ON public.classes;
CREATE POLICY "Authenticated can read classes" ON public.classes FOR SELECT TO authenticated USING (true);

-- Class students
DROP POLICY IF EXISTS "Authenticated can read class_students" ON public.class_students;
CREATE POLICY "Authenticated can read class_students" ON public.class_students FOR SELECT TO authenticated USING (true);

-- Attendance records
DROP POLICY IF EXISTS "Authenticated can read attendance" ON public.attendance_records;
CREATE POLICY "Authenticated can read attendance" ON public.attendance_records FOR SELECT TO authenticated USING (true);

-- Grades
DROP POLICY IF EXISTS "Authenticated can read grades" ON public.grades;
CREATE POLICY "Authenticated can read grades" ON public.grades FOR SELECT TO authenticated USING (true);

-- Grade history
DROP POLICY IF EXISTS "Authenticated can read grade_history" ON public.grade_history;
CREATE POLICY "Authenticated can read grade_history" ON public.grade_history FOR SELECT TO authenticated USING (true);

-- Grade history subjects
DROP POLICY IF EXISTS "Authenticated can read grade_history_subjects" ON public.grade_history_subjects;
CREATE POLICY "Authenticated can read grade_history_subjects" ON public.grade_history_subjects FOR SELECT TO authenticated USING (true);

-- Quizzes
DROP POLICY IF EXISTS "Authenticated can read quizzes" ON public.quizzes;
CREATE POLICY "Authenticated can read quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);

-- Quiz questions
DROP POLICY IF EXISTS "Authenticated can read quiz_questions" ON public.quiz_questions;
CREATE POLICY "Authenticated can read quiz_questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);

-- Quiz attempts
DROP POLICY IF EXISTS "Authenticated can read quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Authenticated can read quiz_attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (true);

-- Quiz answers
DROP POLICY IF EXISTS "Authenticated can read quiz_answers" ON public.quiz_answers;
CREATE POLICY "Authenticated can read quiz_answers" ON public.quiz_answers FOR SELECT TO authenticated USING (true);

-- Lessons
DROP POLICY IF EXISTS "Authenticated can read lessons" ON public.lessons;
CREATE POLICY "Authenticated can read lessons" ON public.lessons FOR SELECT TO authenticated USING (true);

-- Lesson materials
DROP POLICY IF EXISTS "Authenticated can read lesson_materials" ON public.lesson_materials;
CREATE POLICY "Authenticated can read lesson_materials" ON public.lesson_materials FOR SELECT TO authenticated USING (true);

-- Schedules
DROP POLICY IF EXISTS "Authenticated can read schedules" ON public.schedules;
CREATE POLICY "Authenticated can read schedules" ON public.schedules FOR SELECT TO authenticated USING (true);

-- Announcements
DROP POLICY IF EXISTS "Authenticated can read announcements" ON public.announcements;
CREATE POLICY "Authenticated can read announcements" ON public.announcements FOR SELECT TO authenticated USING (true);

-- Chat messages
DROP POLICY IF EXISTS "Authenticated can read chat_messages" ON public.chat_messages;
CREATE POLICY "Authenticated can read chat_messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);

-- Notifications
DROP POLICY IF EXISTS "Authenticated can read notifications" ON public.notifications;
CREATE POLICY "Authenticated can read notifications" ON public.notifications FOR SELECT TO authenticated USING (true);

-- QR attendance sessions
DROP POLICY IF EXISTS "Authenticated can read qr_sessions" ON public.qr_attendance_sessions;
CREATE POLICY "Authenticated can read qr_sessions" ON public.qr_attendance_sessions FOR SELECT TO authenticated USING (true);

-- QR checkins
DROP POLICY IF EXISTS "Authenticated can read qr_checkins" ON public.qr_checkins;
CREATE POLICY "Authenticated can read qr_checkins" ON public.qr_checkins FOR SELECT TO authenticated USING (true);

-- Grade weights
DROP POLICY IF EXISTS "Authenticated can read grade_weights" ON public.grade_weights;
CREATE POLICY "Authenticated can read grade_weights" ON public.grade_weights FOR SELECT TO authenticated USING (true);

-- Quiz reopens
DROP POLICY IF EXISTS "Authenticated can read quiz_reopens" ON public.quiz_reopens;
CREATE POLICY "Authenticated can read quiz_reopens" ON public.quiz_reopens FOR SELECT TO authenticated USING (true);;
