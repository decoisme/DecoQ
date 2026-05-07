-- ============================================================
-- FIX AUDIT_LOGS RLS POLICIES
-- ============================================================
-- This fixes the issue where authenticated users cannot read from audit_logs
-- because RLS is enabled but no policies exist

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow service role full access to audit_logs" ON audit_logs;

-- Create policy: Allow authenticated users to read all audit logs
CREATE POLICY "Allow authenticated users to read audit_logs" 
ON audit_logs
FOR SELECT
TO authenticated
USING (true);

-- Create policy: Allow service role full access (for API endpoints)
CREATE POLICY "Allow service role full access to audit_logs"
ON audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'audit_logs';

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'audit_logs'
ORDER BY policyname;

-- Test query (should work after running this script)
-- SELECT COUNT(*) FROM audit_logs;
