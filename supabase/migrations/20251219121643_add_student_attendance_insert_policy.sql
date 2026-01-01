CREATE POLICY "Students can insert own attendance" ON attendance_records FOR INSERT WITH CHECK (student_id = auth.uid());;
