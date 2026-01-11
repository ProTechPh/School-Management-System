-- Fix search_path for session security functions

CREATE OR REPLACE FUNCTION invalidate_user_sessions(target_user_id UUID, reason TEXT DEFAULT 'manual_logout')
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count INT;
BEGIN
  UPDATE user_sessions 
  SET is_valid = FALSE, invalidation_reason = reason
  WHERE user_id = target_user_id AND is_valid = TRUE;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM user_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days'
     OR (is_valid = FALSE AND last_active < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;;
