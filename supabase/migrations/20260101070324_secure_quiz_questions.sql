-- Security Fix: Prevent students from reading quiz questions directly

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Teachers can view their own quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Students can view quiz questions" ON quiz_questions;

CREATE POLICY "Teachers can view their own quiz questions"
ON quiz_questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
    AND quizzes.teacher_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);;
