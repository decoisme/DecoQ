-- ============================================================
-- FIX RLS POLICIES - Allow users to read their own data
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;

-- Create new policy: Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (
    auth.uid() = auth_user_id
  );

-- Create policy: Allow reading users table for authenticated users
CREATE POLICY "Authenticated users can read users" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Test query (should work after login)
-- SELECT * FROM users WHERE auth_user_id = auth.uid();

