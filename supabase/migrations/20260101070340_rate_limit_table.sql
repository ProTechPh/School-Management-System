-- Create a table for tracking rate limits
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count int DEFAULT 1,
  last_request bigint NOT NULL
);

-- Enable RLS but allow service role access
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Function to clean up old entries
CREATE OR REPLACE FUNCTION clean_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE last_request < (EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000);
END;
$$ LANGUAGE plpgsql;;
