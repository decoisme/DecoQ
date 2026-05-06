-- ============================================================
-- MIGRATION: Admin Key System → Email-Based Auth System
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- 1. CREATE USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')),
  full_name TEXT,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE AUTH LOGS TABLE (Enhanced)
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  action TEXT NOT NULL, -- 'LOGIN', 'LOGOUT', 'INVITE_SENT', 'INVITE_ACCEPTED', 'PASSWORD_RESET', 'ROLE_CHANGED', 'USER_DELETED'
  role TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at DESC);

-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- 5. DROP EXISTING POLICIES (if any)
-- ============================================================
DROP POLICY IF EXISTS "Superadmin can read all users" ON users;
DROP POLICY IF EXISTS "Superadmin can insert users" ON users;
DROP POLICY IF EXISTS "Superadmin can update users" ON users;
DROP POLICY IF EXISTS "Superadmin can delete users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read auth logs" ON auth_logs;
DROP POLICY IF EXISTS "Anyone can insert auth logs" ON auth_logs;

-- 6. CREATE RLS POLICIES FOR USERS TABLE
-- ============================================================

-- Superadmin can read all users
CREATE POLICY "Superadmin can read all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'superadmin'
      AND u.is_active = TRUE
    )
  );

-- Superadmin can insert users (invite admin)
CREATE POLICY "Superadmin can insert users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'superadmin'
      AND u.is_active = TRUE
    )
  );

-- Superadmin can update users
CREATE POLICY "Superadmin can update users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'superadmin'
      AND u.is_active = TRUE
    )
  );

-- Superadmin can delete users (except themselves)
CREATE POLICY "Superadmin can delete users" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'superadmin'
      AND u.is_active = TRUE
    )
    AND auth_user_id != auth.uid() -- Cannot delete self
  );

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Users can update their own data (limited fields)
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (
    auth_user_id = auth.uid()
    AND role = (SELECT role FROM users WHERE auth_user_id = auth.uid()) -- Cannot change own role
  );

-- 7. CREATE RLS POLICIES FOR AUTH_LOGS TABLE
-- ============================================================

-- Authenticated users can read auth logs
CREATE POLICY "Authenticated users can read auth logs" ON auth_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Anyone can insert auth logs (for logging purposes)
CREATE POLICY "Anyone can insert auth logs" ON auth_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- 8. CREATE FUNCTION: Update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. CREATE TRIGGER: Auto-update updated_at
-- ============================================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. CREATE FUNCTION: Handle new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user was invited (exists in users table)
  IF EXISTS (SELECT 1 FROM users WHERE email = NEW.email) THEN
    -- Update auth_user_id
    UPDATE users
    SET auth_user_id = NEW.id,
        updated_at = NOW()
    WHERE email = NEW.email;
    
    -- Log invite acceptance
    INSERT INTO auth_logs (email, action, role, details)
    SELECT email, 'INVITE_ACCEPTED', role, jsonb_build_object('auth_user_id', NEW.id)
    FROM users
    WHERE email = NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. CREATE TRIGGER: On auth.users insert
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 12. CREATE INITIAL SUPERADMIN (IMPORTANT!)
-- ============================================================
-- Ganti dengan email superadmin pertama Anda
-- User ini harus signup manual pertama kali via Supabase Auth

-- CARA SETUP SUPERADMIN PERTAMA:
-- 1. Jalankan script ini
-- 2. Buka Supabase Dashboard → Authentication → Users
-- 3. Klik "Invite User" atau "Add User"
-- 4. Masukkan email superadmin (contoh: superadmin@decoq.com)
-- 5. User akan menerima email invite
-- 6. Setelah user set password, jalankan query ini:

-- INSERT INTO users (email, role, full_name, is_active)
-- VALUES ('superadmin@decoq.com', 'superadmin', 'Super Admin', TRUE)
-- ON CONFLICT (email) DO UPDATE
-- SET role = 'superadmin', is_active = TRUE;

-- Atau jika sudah ada auth_user_id:
-- INSERT INTO users (email, role, full_name, auth_user_id, is_active)
-- VALUES (
--   'superadmin@decoq.com',
--   'superadmin',
--   'Super Admin',
--   'AUTH_USER_ID_DARI_SUPABASE_DASHBOARD',
--   TRUE
-- )
-- ON CONFLICT (email) DO UPDATE
-- SET role = 'superadmin', auth_user_id = EXCLUDED.auth_user_id, is_active = TRUE;

-- 13. CREATE VIEW: Active users stats
-- ============================================================
CREATE OR REPLACE VIEW users_stats AS
SELECT
  COUNT(*) FILTER (WHERE users.role = 'superadmin' AND users.is_active = TRUE) as total_superadmins,
  COUNT(*) FILTER (WHERE users.role = 'admin' AND users.is_active = TRUE) as total_admins,
  COUNT(*) FILTER (WHERE users.is_active = TRUE) as total_active_users,
  COUNT(*) FILTER (WHERE users.is_active = FALSE) as total_inactive_users,
  COUNT(*) as total_users
FROM users;

-- Grant access to view
GRANT SELECT ON users_stats TO authenticated, anon;

-- 14. UPDATE EXISTING AUDIT_LOGS TABLE (if exists)
-- ============================================================
-- Add user_id reference to existing audit_logs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'audit_logs'
  ) THEN
    -- Add user_id column if not exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE audit_logs ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    END IF;
  END IF;
END $$;

-- 15. VERIFICATION QUERIES
-- ============================================================

-- Check tables created
SELECT 
  'users' as table_name,
  COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
  'auth_logs' as table_name,
  COUNT(*) as row_count
FROM auth_logs;

-- Check RLS enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'auth_logs');

-- Check policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'auth_logs')
ORDER BY tablename, policyname;

-- ============================================================
-- SELESAI! ✅
-- 
-- Tables Created:
-- ✓ users (with RLS)
-- ✓ auth_logs (enhanced)
-- 
-- Features:
-- ✓ Email-based authentication
-- ✓ Role-based access control (admin, superadmin)
-- ✓ Invite system via Supabase Auth
-- ✓ Audit logging for all auth actions
-- ✓ RLS policies for security
-- ✓ Auto-update triggers
-- 
-- Next Steps:
-- 1. Setup first superadmin (see step 12)
-- 2. Configure Supabase Auth email templates
-- 3. Update Next.js app to use new auth system
-- ============================================================

-- NOTES:
-- - Existing admin_key system akan diganti dengan email auth
-- - QRIS registry, verification_logs, audit_logs tetap ada
-- - Migration bertahap: bisa jalankan kedua sistem parallel dulu
-- - Setelah migrasi selesai, hapus ADMIN_KEY dan SUPERADMIN_KEY dari env
