-- Security Fix: Prevent students from reading quiz questions directly
-- This ensures they cannot bypass the API to see correct answers.

-- 1. Enable RLS if not already enabled
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- 2. Revoke general SELECT permission for authenticated users (if previously granted)
-- Note: In Supabase, 'authenticated' role usually has permissions granted by default policies.
-- We must ensure no policy allows students to SELECT from quiz_questions.

-- 3. Create Policy for Teachers/Admins only
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
);

-- Note: We DO NOT create a policy for students. 
-- Since RLS is enabled and no policy grants them access, 
-- direct queries from the browser console will return 0 rows or error.
-- The server-side API uses the Service Role key to bypass RLS and fetch questions.