-- ============================================================
-- UPDATE users_stats VIEW to include pending users
-- ============================================================

-- Drop existing view
DROP VIEW IF EXISTS users_stats;

-- Recreate view with pending users count
CREATE VIEW users_stats AS
SELECT
  COUNT(*) FILTER (WHERE users.role = 'superadmin' AND users.is_active = TRUE) as total_superadmins,
  COUNT(*) FILTER (WHERE users.role = 'admin' AND users.is_active = TRUE) as total_admins,
  COUNT(*) FILTER (WHERE users.is_active = TRUE) as total_active_users,
  COUNT(*) FILTER (WHERE users.is_active = FALSE AND users.status != 'pending') as total_inactive_users,
  COUNT(*) FILTER (WHERE users.status = 'pending') as total_pending_users,
  COUNT(*) as total_users
FROM users;

-- Grant access to view
GRANT SELECT ON users_stats TO authenticated, anon, service_role;

-- Test the view
SELECT * FROM users_stats;
