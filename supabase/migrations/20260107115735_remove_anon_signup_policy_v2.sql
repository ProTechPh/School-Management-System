-- Migration: Remove Anonymous Signup Policy on Users Table
-- SECURITY FIX: Remove overly permissive anon insert policy
-- 安全修复：移除过于宽松的匿名插入策略

-- Drop the permissive anonymous insert policy
DROP POLICY IF EXISTS "Allow signup insert" ON public.users;;
