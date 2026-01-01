-- Allow admins to insert student profiles
CREATE POLICY "Admins can insert student profiles"
ON public.student_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to insert teacher profiles
CREATE POLICY "Admins can insert teacher profiles"
ON public.teacher_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);;
