-- ============================================================
-- CHECK QRIS_DATABASE RLS POLICIES
-- ============================================================

-- Check if RLS is enabled on qris_database
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'qris_database';

-- Check existing policies on qris_database
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'qris_database'
ORDER BY policyname;

-- If no policies exist, we need to create them
-- This is likely the issue - RLS is enabled but no policies allow reading
