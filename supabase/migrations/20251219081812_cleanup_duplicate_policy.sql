-- Remove the duplicate admin read policy
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;;
