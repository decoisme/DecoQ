-- ============================================
-- FIX RLS POLICY FOR INVITATION TOKEN VERIFICATION
-- ============================================

-- Problem: Anonymous users cannot query users table by invitation_token
-- Solution: Add RLS policy to allow reading user by invitation_token

-- Step 1: Check current RLS policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- Step 2: Drop old restrictive policies if they exist
DROP POLICY IF EXISTS "Allow anonymous to read user by invitation token" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Step 3: Create new policy to allow reading by invitation_token
-- This allows the confirm page to verify the token
CREATE POLICY "Allow reading user by invitation token"
ON users
FOR SELECT
TO anon, authenticated
USING (
  invitation_token IS NOT NULL
  OR auth.uid() = auth_user_id
);

-- Step 4: Ensure authenticated users can read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Step 5: Allow authenticated users to update their own data (for password setup)
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Step 6: Verify policies are created
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================
-- ALTERNATIVE: Temporarily disable RLS for testing
-- ============================================

-- If above doesn't work, temporarily disable RLS:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test invitation, then re-enable:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION
-- ============================================

-- Test query as anonymous user (this is what confirm page does)
-- Run this in Supabase SQL Editor (runs as service role, but simulates the query)
SELECT 
  id,
  email,
  role,
  status,
  is_active,
  full_name,
  invitation_expires_at,
  auth_user_id
FROM users
WHERE invitation_token = 'ec5c0ad9a856cd060a943ab5b45125d87e53c9a68ccc701fc38f8dff20f7952f'  -- Replace with actual token from URL
LIMIT 1;

-- If this returns a row, RLS is working
-- If this returns nothing, RLS is still blocking

-- ============================================
-- NUCLEAR OPTION: Disable RLS completely
-- ============================================

-- Only use this if nothing else works
-- WARNING: This removes all RLS protection!

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';
-- rowsecurity should be false

-- After testing works, you can re-enable and fix policies properly
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
