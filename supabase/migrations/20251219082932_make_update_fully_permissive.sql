-- Make UPDATE fully permissive for testing

-- Users table
DROP POLICY IF EXISTS "Users update policy" ON public.users;
CREATE POLICY "Users update policy" ON public.users FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Teacher profiles
DROP POLICY IF EXISTS "Teacher profiles update policy" ON public.teacher_profiles;
CREATE POLICY "Teacher profiles update policy" ON public.teacher_profiles FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Student profiles
DROP POLICY IF EXISTS "Student profiles update policy" ON public.student_profiles;
CREATE POLICY "Student profiles update policy" ON public.student_profiles FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);;
