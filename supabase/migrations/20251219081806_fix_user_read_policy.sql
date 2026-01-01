-- Drop the existing restrictive policy and create a more permissive one
DROP POLICY IF EXISTS "Users can read own data" ON public.users;

-- Allow authenticated users to read their own data OR admins to read all
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);;
