-- Simplify admin update policies to be more permissive

-- Drop and recreate users update policy
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Single policy: admins can update any user, users can update themselves
CREATE POLICY "Users update policy" ON public.users FOR UPDATE TO authenticated
USING (true)
WITH CHECK (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Drop and recreate teacher_profiles update policy
DROP POLICY IF EXISTS "Admins can update teacher profiles" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Users can update own teacher profile" ON public.teacher_profiles;

-- Single policy: admins can update any profile, teachers can update their own
CREATE POLICY "Teacher profiles update policy" ON public.teacher_profiles FOR UPDATE TO authenticated
USING (true)
WITH CHECK (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);;
