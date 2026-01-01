-- Simplify student_profiles update policy

DROP POLICY IF EXISTS "Admins can update student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can update own student profile" ON public.student_profiles;

-- Single policy: admins can update any profile, students can update their own
CREATE POLICY "Student profiles update policy" ON public.student_profiles FOR UPDATE TO authenticated
USING (true)
WITH CHECK (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);;
