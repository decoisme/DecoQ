-- ============================================================
-- QUICK FIX: users_stats view error
-- Run this if you get "column role does not exist" error
-- ============================================================

-- Drop existing view (if any)
DROP VIEW IF EXISTS users_stats;

-- Recreate view with explicit table reference
CREATE VIEW users_stats AS
SELECT
  COUNT(*) FILTER (WHERE users.role = 'superadmin' AND users.is_active = TRUE) as total_superadmins,
  COUNT(*) FILTER (WHERE users.role = 'admin' AND users.is_active = TRUE) as total_admins,
  COUNT(*) FILTER (WHERE users.is_active = TRUE) as total_active_users,
  COUNT(*) FILTER (WHERE users.is_active = FALSE) as total_inactive_users,
  COUNT(*) as total_users
FROM users;

-- Grant access to view
GRANT SELECT ON users_stats TO authenticated, anon;

-- Test the view
SELECT * FROM users_stats;

-- Expected output (if no users yet):
-- total_superadmins | total_admins | total_active_users | total_inactive_users | total_users
-- ------------------+--------------+--------------------+----------------------+-------------
--                 0 |            0 |                  0 |                    0 |           0

-- ============================================================
-- DONE! ✅
-- View should now work correctly
-- ============================================================
