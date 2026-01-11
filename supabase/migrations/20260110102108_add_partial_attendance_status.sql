-- Add 'partial' status to attendance_records
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check CHECK (status IN ('present', 'absent', 'late', 'excused', 'partial'));;
