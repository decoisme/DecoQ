-- ============================================================
-- FIX QRIS_DATABASE RLS POLICIES
-- ============================================================
-- This fixes the issue where authenticated users cannot read from qris_database
-- because RLS is enabled but no policies exist

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read qris_database" ON qris_database;
DROP POLICY IF EXISTS "Allow service role full access to qris_database" ON qris_database;

-- Create policy: Allow authenticated users to read all QRIS data
CREATE POLICY "Allow authenticated users to read qris_database" 
ON qris_database
FOR SELECT
TO authenticated
USING (true);

-- Create policy: Allow service role full access (for API endpoints)
CREATE POLICY "Allow service role full access to qris_database"
ON qris_database
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
WHERE tablename = 'qris_database';

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
WHERE tablename = 'qris_database'
ORDER BY policyname;

-- Test query (should work after running this script)
-- SELECT COUNT(*) FROM qris_database;
