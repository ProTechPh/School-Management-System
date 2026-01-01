-- Create table for quiz activity logs (anti-cheating)
CREATE TABLE IF NOT EXISTS quiz_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'tab_switch', 'window_blur', 'copy', 'paste', 'right_click', 'exit_attempt'
  event_count INTEGER DEFAULT 1,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE quiz_activity_logs ENABLE ROW LEVEL SECURITY;

-- Students can insert their own logs
CREATE POLICY "Students can insert own activity logs" ON quiz_activity_logs
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can view their own logs
CREATE POLICY "Students can view own activity logs" ON quiz_activity_logs
  FOR SELECT USING (student_id = auth.uid());

-- Teachers can view logs for their quizzes
CREATE POLICY "Teachers can view logs for their quizzes" ON quiz_activity_logs
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM quizzes WHERE teacher_id = auth.uid())
  );

-- Add summary columns to quiz_attempts for quick access
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS tab_switches INTEGER DEFAULT 0;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS copy_paste_count INTEGER DEFAULT 0;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS exit_attempts INTEGER DEFAULT 0;;
