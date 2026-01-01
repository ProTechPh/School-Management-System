-- Create table to store individual question answers
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  points_awarded NUMERIC DEFAULT 0,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- Enable RLS
ALTER TABLE quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can insert their own answers" ON quiz_attempt_answers
  FOR INSERT WITH CHECK (
    attempt_id IN (SELECT id FROM quiz_attempts WHERE student_id = auth.uid())
  );

CREATE POLICY "Students can view their own answers" ON quiz_attempt_answers
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM quiz_attempts WHERE student_id = auth.uid())
  );

CREATE POLICY "Teachers can view answers for their quizzes" ON quiz_attempt_answers
  FOR SELECT USING (
    attempt_id IN (
      SELECT qa.id FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE q.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update answers for grading" ON quiz_attempt_answers
  FOR UPDATE USING (
    attempt_id IN (
      SELECT qa.id FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE q.teacher_id = auth.uid()
    )
  );;
