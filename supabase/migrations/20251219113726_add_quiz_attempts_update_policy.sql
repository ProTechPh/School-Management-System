CREATE POLICY "Students can update own quiz attempts" ON quiz_attempts FOR UPDATE USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());;
