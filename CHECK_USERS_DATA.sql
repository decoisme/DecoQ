-- ============================================================
-- CHECK USERS DATA
-- ============================================================

-- Check if users table has data
SELECT 
  id,
  email,
  role,
  full_name,
  is_active,
  status,
  last_login_at,
  auth_user_id,
  created_at,
  invited_at
FROM users
ORDER BY created_at DESC;

-- Check column structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check if status column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'status'
    ) THEN 'Status column EXISTS ✅'
    ELSE 'Status column MISSING ❌'
  END as status_column_check;

-- Check if last_login_at column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'last_login_at'
    ) THEN 'last_login_at column EXISTS ✅'
    ELSE 'last_login_at column MISSING ❌'
  END as last_login_at_check;

-- Count users by status
SELECT 
  COALESCE(status, 'NULL') as status,
  COUNT(*) as count
FROM users
GROUP BY status;

-- Count users by role
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role;
