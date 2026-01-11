-- Function to check and increment rate limits atomically
CREATE OR REPLACE FUNCTION check_rate_limit(
  identifier text,
  max_requests int,
  window_ms int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count int;
  last_req bigint;
  now_ms bigint;
BEGIN
  now_ms := (extract(epoch from now()) * 1000)::bigint;

  INSERT INTO rate_limits (key, count, last_request)
  VALUES (identifier, 0, now_ms)
  ON CONFLICT (key) DO NOTHING;

  SELECT count, last_request INTO current_count, last_req
  FROM rate_limits
  WHERE key = identifier
  FOR UPDATE;

  IF (now_ms - last_req) > window_ms THEN
    UPDATE rate_limits
    SET count = 1, last_request = now_ms
    WHERE key = identifier;
    RETURN true;
  ELSIF current_count >= max_requests THEN
    RETURN false;
  ELSE
    UPDATE rate_limits
    SET count = current_count + 1
    WHERE key = identifier;
    RETURN true;
  END IF;
END;
$$;;
