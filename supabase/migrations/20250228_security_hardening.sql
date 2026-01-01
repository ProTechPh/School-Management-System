-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 1. PII PROTECTION & RLS FOR USERS
-- Revoke generic select access to prevent scraping
REVOKE SELECT ON users FROM authenticated, anon;

-- Grant column-level access only to safe fields for authenticated users
-- This prevents students from querying 'phone' or 'address' directly
GRANT SELECT (id, email, name, role, avatar, created_at, is_active) ON users TO authenticated;

-- Policy: Users can view basic info of others (needed for UI lists), but only safe columns are selectable
CREATE POLICY "View safe user profiles" ON users
FOR SELECT TO authenticated
USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Update own profile" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- 2. STRICT RLS FOR GRADES
-- Students can only see their own grades
CREATE POLICY "Students view own grades" ON grades
FOR SELECT TO authenticated
USING (
  auth.uid() = student_id OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- 3. STRICT RLS FOR QUIZ ATTEMPTS
-- Students can only see their own attempts
CREATE POLICY "Students view own attempts" ON quiz_attempts
FOR SELECT TO authenticated
USING (
  auth.uid() = student_id OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- 4. ATOMIC QUIZ SUBMISSION (Fixes Race Condition)
-- Unique constraint to prevent duplicate completed attempts
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_completed_attempt 
ON quiz_attempts (quiz_id, student_id) 
WHERE completed_at IS NOT NULL;

-- Atomic RPC function for submission
CREATE OR REPLACE FUNCTION submit_quiz_attempt(
  p_quiz_id UUID,
  p_student_id UUID,
  p_score INTEGER,
  p_max_score INTEGER,
  p_percentage INTEGER,
  p_needs_grading BOOLEAN,
  p_tab_switches INTEGER,
  p_copy_paste_count INTEGER,
  p_exit_attempts INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_attempt_id UUID;
  v_existing_completed TIMESTAMPTZ;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT id, completed_at INTO v_attempt_id, v_existing_completed
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id AND student_id = p_student_id
  FOR UPDATE;

  IF v_attempt_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attempt not started');
  END IF;

  IF v_existing_completed IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz already submitted');
  END IF;

  -- Update the attempt
  UPDATE quiz_attempts
  SET 
    score = p_score,
    max_score = p_max_score,
    percentage = p_percentage,
    needs_grading = p_needs_grading,
    completed_at = NOW(),
    tab_switches = p_tab_switches,
    copy_paste_count = p_copy_paste_count,
    exit_attempts = p_exit_attempts
  WHERE id = v_attempt_id;

  RETURN jsonb_build_object('success', true, 'attempt_id', v_attempt_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;