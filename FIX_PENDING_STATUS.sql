-- ============================================================
-- FIX: Set correct status for pending users
-- ============================================================

-- Users yang baru di-invite (punya auth_user_id tapi is_active = false) = pending
-- Users yang dinonaktifkan (tidak punya auth_user_id dan is_active = false) = inactive

-- Set pending for users who have auth_user_id but not active yet
UPDATE users 
SET status = 'pending' 
WHERE is_active = false 
  AND auth_user_id IS NOT NULL
  AND last_login_at IS NULL;

-- Set inactive for users who don't have auth_user_id and not active
UPDATE users 
SET status = 'inactive' 
WHERE is_active = false 
  AND auth_user_id IS NULL;

-- Verify
SELECT 
  email,
  role,
  is_active,
  status,
  auth_user_id IS NOT NULL as has_auth,
  last_login_at IS NOT NULL as has_logged_in,
  CASE 
    WHEN status = 'pending' THEN '⏳ Pending (belum aktivasi)'
    WHEN status = 'active' THEN '● Active (sudah aktivasi)'
    WHEN status = 'inactive' THEN '○ Inactive (dinonaktifkan)'
    ELSE '? Unknown'
  END as status_description
FROM users
ORDER BY created_at DESC;
