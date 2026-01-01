CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_student_class_date_idx ON attendance_records (student_id, class_id, date);;
