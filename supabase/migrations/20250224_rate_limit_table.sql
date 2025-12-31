-- Create a table for tracking rate limits
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count int DEFAULT 1,
  last_request bigint NOT NULL
);

-- Enable RLS but allow service role access (which API routes use)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Optional: Create a function to clean up old entries to keep table small
CREATE OR REPLACE FUNCTION clean_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE last_request < (EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000); -- older than 1 hour
END;
$$ LANGUAGE plpgsql;