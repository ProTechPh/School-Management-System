-- RPC to fetch students who do not have a profile yet
CREATE OR REPLACE FUNCTION get_unlinked_students()
RETURNS TABLE (id uuid, email text, name text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT u.id, u.email, u.name
  FROM users u
  LEFT JOIN student_profiles sp ON u.id = sp.id
  WHERE u.role = 'student' AND sp.id IS NULL
  ORDER BY u.name
  LIMIT 100;
$$;;
