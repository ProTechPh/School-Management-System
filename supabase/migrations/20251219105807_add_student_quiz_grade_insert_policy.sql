-- Allow students to insert their own quiz grades
CREATE POLICY "Students can insert own quiz grades" ON grades
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND type = 'quiz'
  );;
