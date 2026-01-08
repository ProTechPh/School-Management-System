-- Add indexes to auth.audit_log_entries for better query performance
-- This table is automatically created by Supabase Auth
-- Note: We cannot create indexes on auth.audit_log_entries as it's managed by Supabase
-- The table has these columns: instance_id, id, payload (json), created_at, ip_address

-- Create a view for easier querying with user information
-- Extract user_id and action from the JSON payload
CREATE OR REPLACE VIEW public.audit_logs_with_users AS
SELECT 
  ale.id,
  (ale.payload->>'actor_id')::uuid as user_id,
  ale.payload->>'action' as action,
  ale.ip_address,
  ale.created_at,
  ale.payload,
  u.email,
  u.name,
  u.role
FROM auth.audit_log_entries ale
LEFT JOIN public.users u ON (ale.payload->>'actor_id')::uuid = u.id;

-- Grant access to the view
GRANT SELECT ON public.audit_logs_with_users TO authenticated;

COMMENT ON VIEW public.audit_logs_with_users IS 'Audit logs joined with user information for easier querying';
