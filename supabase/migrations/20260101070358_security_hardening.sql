-- Atomic quiz submission function
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

-- Unique constraint to prevent duplicate completed attempts
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_completed_attempt 
ON quiz_attempts (quiz_id, student_id) 
WHERE completed_at IS NOT NULL;;
