CREATE POLICY "Students can update own attendance" ON attendance_records FOR UPDATE USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());;
