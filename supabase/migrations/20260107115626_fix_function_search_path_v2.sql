-- Migration: Fix Function Search Path Security (v2)
-- SECURITY FIX: Set search_path to empty string to prevent search path injection attacks
-- 安全修复：设置 search_path 为空字符串以防止搜索路径注入攻击

-- Fix check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  identifier text,
  max_requests int,
  window_ms int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_count int;
  last_req bigint;
  now_ms bigint;
BEGIN
  now_ms := (extract(epoch from now()) * 1000)::bigint;

  -- Ensure record exists (atomic insert if not exists)
  INSERT INTO public.rate_limits (key, count, last_request)
  VALUES (identifier, 0, now_ms)
  ON CONFLICT (key) DO NOTHING;

  -- Lock row for update to ensure serial execution for this key
  SELECT count, last_request INTO current_count, last_req
  FROM public.rate_limits
  WHERE key = identifier
  FOR UPDATE;

  IF (now_ms - last_req) > window_ms THEN
    -- Window expired, reset counter
    UPDATE public.rate_limits
    SET count = 1, last_request = now_ms
    WHERE key = identifier;
    RETURN true;
  ELSIF current_count >= max_requests THEN
    -- Limit reached
    RETURN false;
  ELSE
    -- Increment counter
    UPDATE public.rate_limits
    SET count = current_count + 1
    WHERE key = identifier;
    RETURN true;
  END IF;
END;
$$;

-- Fix clean_rate_limits function
CREATE OR REPLACE FUNCTION public.clean_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE last_request < (extract(epoch from now()) * 1000)::bigint - 3600000;
END;
$$;

-- Drop and recreate get_unlinked_students function with fixed search_path
DROP FUNCTION IF EXISTS public.get_unlinked_students();

CREATE FUNCTION public.get_unlinked_students()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  avatar text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.avatar
  FROM public.users u
  LEFT JOIN public.parent_children pc ON u.id = pc.child_id
  WHERE u.role = 'student'
    AND pc.id IS NULL
  ORDER BY u.name;
END;
$$;

-- Fix submit_quiz_attempt function
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id UUID,
  p_student_id UUID,
  p_score INTEGER,
  p_max_score INTEGER,
  p_percentage INTEGER,
  p_needs_grading BOOLEAN,
  p_tab_switches INTEGER,
  p_copy_paste_count INTEGER,
  p_exit_attempts INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempt_id UUID;
  v_existing_completed TIMESTAMPTZ;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT id, completed_at INTO v_attempt_id, v_existing_completed
  FROM public.quiz_attempts
  WHERE quiz_id = p_quiz_id AND student_id = p_student_id
  FOR UPDATE;

  IF v_attempt_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attempt not started');
  END IF;

  IF v_existing_completed IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz already submitted');
  END IF;

  -- Update the attempt
  UPDATE public.quiz_attempts
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
$$;;
