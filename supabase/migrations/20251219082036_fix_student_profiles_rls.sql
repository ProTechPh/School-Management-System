-- Allow authenticated users to read all student profiles
DROP POLICY IF EXISTS "Users can read own student profile" ON public.student_profiles;
CREATE POLICY "Authenticated can read student profiles"
ON public.student_profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to update any student profile
CREATE POLICY "Admins can update student profiles"
ON public.student_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);;
