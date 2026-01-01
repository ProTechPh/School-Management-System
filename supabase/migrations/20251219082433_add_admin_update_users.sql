-- Allow admins to update any user
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Allow admins to update any teacher profile
DROP POLICY IF EXISTS "Admins can update teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Admins can update teacher profiles" ON public.teacher_profiles FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));;
