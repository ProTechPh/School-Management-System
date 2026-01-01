-- Allow authenticated users to read all teacher profiles
DROP POLICY IF EXISTS "Users can read own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Authenticated can read teacher profiles"
ON public.teacher_profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to update any teacher profile
CREATE POLICY "Admins can update teacher profiles"
ON public.teacher_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);;
