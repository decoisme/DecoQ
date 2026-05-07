-- ============================================================
-- FIX ALL RLS POLICIES FOR DASHBOARD
-- ============================================================
-- This script fixes RLS policies for all tables used in dashboard
-- Run this in Supabase SQL Editor to enable dashboard access

-- ============================================================
-- 1. QRIS_DATABASE TABLE
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read qris_database" ON qris_database;
DROP POLICY IF EXISTS "Allow service role full access to qris_database" ON qris_database;

-- Create policies
CREATE POLICY "Allow authenticated users to read qris_database" 
ON qris_database
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service role full access to qris_database"
ON qris_database
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 2. VERIFICATION_LOGS TABLE
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read verification_logs" ON verification_logs;
DROP POLICY IF EXISTS "Allow service role full access to verification_logs" ON verification_logs;

-- Create policies
CREATE POLICY "Allow authenticated users to read verification_logs" 
ON verification_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service role full access to verification_logs"
ON verification_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 3. AUDIT_LOGS TABLE
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow service role full access to audit_logs" ON audit_logs;

-- Create policies
CREATE POLICY "Allow authenticated users to read audit_logs" 
ON audit_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service role full access to audit_logs"
ON audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 4. USERS TABLE (Already fixed, but included for completeness)
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;

-- Create policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Authenticated users can read users" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- VERIFICATION SUMMARY
-- ============================================================

-- Check RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('qris_database', 'verification_logs', 'audit_logs', 'users')
ORDER BY tablename;

-- Check all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('qris_database', 'verification_logs', 'audit_logs', 'users')
ORDER BY tablename, policyname;

-- Test queries (should all work after running this script)
-- SELECT COUNT(*) as total_qris FROM qris_database;
-- SELECT COUNT(*) as total_verification_logs FROM verification_logs;
-- SELECT COUNT(*) as total_audit_logs FROM audit_logs;
-- SELECT COUNT(*) as total_users FROM users;

-- ============================================================
-- EXPECTED OUTPUT
-- ============================================================
-- After running this script, you should see:
-- 
-- RLS Status:
-- - qris_database: rls_enabled = true
-- - verification_logs: rls_enabled = true
-- - audit_logs: rls_enabled = true
-- - users: rls_enabled = true
--
-- Policies (2 per table):
-- - Allow authenticated users to read [table]
-- - Allow service role full access to [table]
--
-- All test queries should return counts without errors
-- ============================================================
