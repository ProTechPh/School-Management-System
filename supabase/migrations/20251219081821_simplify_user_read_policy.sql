-- Simplify: allow all authenticated users to read users table
DROP POLICY IF EXISTS "Users can read own data" ON public.users;

CREATE POLICY "Authenticated users can read users"
ON public.users
FOR SELECT
TO authenticated
USING (true);;
