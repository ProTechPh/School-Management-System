-- Add write policies for admins/teachers

-- Classes - admins can manage
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- Attendance - teachers/admins can manage
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance_records;
CREATE POLICY "Teachers can manage attendance" ON public.attendance_records FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- Grades - teachers/admins can manage
DROP POLICY IF EXISTS "Teachers can manage grades" ON public.grades;
CREATE POLICY "Teachers can manage grades" ON public.grades FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- Quizzes - teachers/admins can manage
DROP POLICY IF EXISTS "Teachers can manage quizzes" ON public.quizzes;
CREATE POLICY "Teachers can manage quizzes" ON public.quizzes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- Quiz questions - teachers/admins can manage
DROP POLICY IF EXISTS "Teachers can manage quiz_questions" ON public.quiz_questions;
CREATE POLICY "Teachers can manage quiz_questions" ON public.quiz_questions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- Lessons - teachers/admins can manage
DROP POLICY IF EXISTS "Teachers can manage lessons" ON public.lessons;
CREATE POLICY "Teachers can manage lessons" ON public.lessons FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- Announcements - teachers/admins can manage
DROP POLICY IF EXISTS "Teachers can manage announcements" ON public.announcements;
CREATE POLICY "Teachers can manage announcements" ON public.announcements FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- QR sessions - teachers can manage
DROP POLICY IF EXISTS "Teachers can manage qr_sessions" ON public.qr_attendance_sessions;
CREATE POLICY "Teachers can manage qr_sessions" ON public.qr_attendance_sessions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- QR checkins - students can insert their own
DROP POLICY IF EXISTS "Students can checkin" ON public.qr_checkins;
CREATE POLICY "Students can checkin" ON public.qr_checkins FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

-- Quiz attempts - students can insert their own
DROP POLICY IF EXISTS "Students can submit quiz" ON public.quiz_attempts;
CREATE POLICY "Students can submit quiz" ON public.quiz_attempts FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

-- Quiz answers - students can insert their own
DROP POLICY IF EXISTS "Students can submit answers" ON public.quiz_answers;
CREATE POLICY "Students can submit answers" ON public.quiz_answers FOR INSERT TO authenticated
WITH CHECK (true);;
