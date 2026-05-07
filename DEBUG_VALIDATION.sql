-- ============================================================
-- DEBUG VALIDATION ISSUE
-- ============================================================

-- 1. Check RLS policies on qris_database
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'qris_database'
ORDER BY policyname;

-- 2. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'qris_database';

-- 3. Test query as anon user (simulating frontend)
SET ROLE anon;
SELECT * FROM qris_database WHERE is_active = true;
RESET ROLE;

-- 4. Test query as authenticated user
SET ROLE authenticated;
SELECT * FROM qris_database WHERE is_active = true;
RESET ROLE;

-- 5. Test query as service_role (simulating API)
-- This should always work
SELECT * FROM qris_database WHERE is_active = true;

-- 6. Show all data with hash
SELECT 
  merchant_name,
  merchant_id,
  hash,
  is_active,
  LENGTH(hash) as hash_length
FROM qris_database;
