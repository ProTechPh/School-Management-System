-- Migration: Tighten RLS Policies
-- SECURITY FIX: Replace overly permissive USING(true) policies with proper user-scoped checks
-- 安全修复：将过于宽松的 USING(true) 策略替换为适当的用户范围检查

-- =====================================================
-- 1. FIX USERS TABLE POLICIES
-- =====================================================

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Users update policy" ON public.users;

-- Create proper user-scoped update policy (users can only update their own record)
CREATE POLICY "Users can update own record"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Keep admin update policy if it exists, or create it
DROP POLICY IF EXISTS "Only admins can update users" ON public.users;
CREATE POLICY "Admins can update any user"
ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- 2. FIX STUDENT_PROFILES TABLE POLICIES
-- =====================================================

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Student profiles update policy" ON public.student_profiles;

-- Create proper user-scoped update policy
CREATE POLICY "Students can update own profile"
ON public.student_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin policy for student profiles
CREATE POLICY "Admins can update student profiles"
ON public.student_profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Fix anonymous insert policy - require ID match for signup flow
DROP POLICY IF EXISTS "Allow signup insert" ON public.student_profiles;
CREATE POLICY "Allow authenticated insert own profile"
ON public.student_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. FIX TEACHER_PROFILES TABLE POLICIES
-- =====================================================

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Teacher profiles update policy" ON public.teacher_profiles;

-- Create proper user-scoped update policy
CREATE POLICY "Teachers can update own profile"
ON public.teacher_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin policy for teacher profiles
CREATE POLICY "Admins can update teacher profiles"
ON public.teacher_profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Fix anonymous insert policy
DROP POLICY IF EXISTS "Allow signup insert" ON public.teacher_profiles;
CREATE POLICY "Allow authenticated insert own profile"
ON public.teacher_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =====================================================
-- 4. FIX QUIZ_ANSWERS TABLE POLICIES
-- =====================================================

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Students can submit answers" ON public.quiz_answers;

-- Create proper user-scoped insert policy
-- Students can only submit answers for their own quiz attempts
CREATE POLICY "Students can submit own answers"
ON public.quiz_answers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    WHERE qa.id = attempt_id
    AND qa.student_id = auth.uid()
  )
);

-- =====================================================
-- 5. ADD RATE_LIMITS TABLE RLS POLICY
-- =====================================================

-- The rate_limits table should only be accessible by the service role
-- No direct user access needed
CREATE POLICY "Service role only"
ON public.rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);;
