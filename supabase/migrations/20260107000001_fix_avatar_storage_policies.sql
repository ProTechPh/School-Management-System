-- Migration: Fix Avatar Storage Policies
-- SECURITY FIX: Enforce user-specific paths to prevent cross-user file overwrites
-- 安全修复：强制用户特定路径，防止跨用户文件覆盖

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Create secure policies that enforce user ID in file path
-- 创建安全策略，强制文件路径中包含用户ID

-- Policy: Users can only upload files to their own folder (userId/filename)
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can only update files in their own folder
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can only delete files in their own folder
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Keep public read access for avatars (needed to display avatars)
-- Public read policy should already exist, but ensure it does
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public read access for avatars'
  ) THEN
    CREATE POLICY "Public read access for avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;
