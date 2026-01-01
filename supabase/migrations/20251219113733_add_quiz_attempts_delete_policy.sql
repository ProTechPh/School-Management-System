CREATE POLICY "Students can delete own incomplete attempts" ON quiz_attempts FOR DELETE USING (student_id = auth.uid() AND completed_at IS NULL);;
