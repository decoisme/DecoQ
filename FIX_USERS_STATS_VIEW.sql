-- ============================================================
-- FIX: Create users_stats view
-- ============================================================

-- Drop view if exists
DROP VIEW IF EXISTS users_stats;

-- Create view
CREATE VIEW users_stats AS
SELECT
  COUNT(*) FILTER (WHERE users.role = 'superadmin' AND users.is_active = TRUE) as total_superadmins,
  COUNT(*) FILTER (WHERE users.role = 'admin' AND users.is_active = TRUE) as total_admins,
  COUNT(*) FILTER (WHERE users.is_active = TRUE) as total_active_users,
  COUNT(*) FILTER (WHERE users.is_active = FALSE) as total_inactive_users,
  COUNT(*) as total_users
FROM users;

-- Grant access
GRANT SELECT ON users_stats TO authenticated, anon, service_role;

-- Verify
SELECT * FROM users_stats;
