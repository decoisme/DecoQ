-- ============================================================
-- MIGRATION: Admin Key System → Email-Based Auth System
-- SAFE VERSION - Step by Step Execution
-- ============================================================

-- ============================================================
-- PART 1: CREATE TABLES
-- ============================================================

-- 1. CREATE USERS TABLE
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

-- 2. CREATE AUTH LOGS TABLE
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  action TEXT NOT NULL,
  role TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 2: CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at DESC);

-- ============================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 4: DROP EXISTING POLICIES (if any)
-- ============================================================

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Superadmin can read all users" ON users;
  DROP POLICY IF EXISTS "Superadmin can insert users" ON users;
  DROP POLICY IF EXISTS "Superadmin can update users" ON users;
  DROP POLICY IF EXISTS "Superadmin can delete users" ON users;
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Authenticated users can read auth logs" ON auth_logs;
  DROP POLICY IF EXISTS "Anyone can insert auth logs" ON auth_logs;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- ============================================================
-- PART 5: CREATE RLS POLICIES FOR USERS TABLE
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
    AND auth_user_id != auth.uid()
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
    AND role = (SELECT role FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================
-- PART 6: CREATE RLS POLICIES FOR AUTH_LOGS TABLE
-- ============================================================

-- Authenticated users can read auth logs
CREATE POLICY "Authenticated users can read auth logs" ON auth_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Anyone can insert auth logs (for logging purposes)
CREATE POLICY "Anyone can insert auth logs" ON auth_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- PART 7: CREATE FUNCTIONS & TRIGGERS
-- ============================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Handle new user signup
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

-- Trigger: On auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- PART 8: CREATE VIEW (After tables exist)
-- ============================================================

-- Drop view if exists
DROP VIEW IF EXISTS users_stats;

-- Create view with explicit table reference
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

-- ============================================================
-- PART 9: UPDATE EXISTING AUDIT_LOGS TABLE (if exists)
-- ============================================================

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

-- ============================================================
-- PART 10: VERIFICATION QUERIES
-- ============================================================

-- Check tables created
DO $$
BEGIN
  RAISE NOTICE 'Checking tables...';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE NOTICE '✓ users table exists';
  ELSE
    RAISE EXCEPTION '✗ users table NOT created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_logs') THEN
    RAISE NOTICE '✓ auth_logs table exists';
  ELSE
    RAISE EXCEPTION '✗ auth_logs table NOT created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'users_stats') THEN
    RAISE NOTICE '✓ users_stats view exists';
  ELSE
    RAISE EXCEPTION '✗ users_stats view NOT created';
  END IF;
END $$;

-- Check RLS enabled
SELECT 
  tablename, 
  CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'auth_logs');

-- Check policies count
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'auth_logs')
GROUP BY tablename;

-- ============================================================
-- PART 11: SETUP FIRST SUPERADMIN
-- ============================================================

-- IMPORTANT: Jalankan ini SETELAH user signup via Supabase Auth
-- 
-- Cara setup superadmin pertama:
-- 1. Buka Supabase Dashboard → Authentication → Users
-- 2. Klik "Invite User" atau "Add User"
-- 3. Masukkan email superadmin (contoh: superadmin@decoq.com)
-- 4. User akan menerima email invite
-- 5. User klik link → set password
-- 6. Setelah signup, jalankan query ini:

/*
-- Get auth_user_id from Supabase Dashboard
-- Then insert to users table:

INSERT INTO users (email, role, full_name, auth_user_id, is_active)
VALUES (
  'superadmin@decoq.com',
  'superadmin',
  'Super Admin',
  'PASTE_AUTH_USER_ID_HERE', -- Ganti dengan ID dari auth.users
  TRUE
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'superadmin', 
  auth_user_id = EXCLUDED.auth_user_id, 
  is_active = TRUE;

-- Verify
SELECT * FROM users WHERE email = 'superadmin@decoq.com';
*/

-- ============================================================
-- SELESAI! ✅
-- 
-- Tables Created:
-- ✓ users (with RLS)
-- ✓ auth_logs (with RLS)
-- 
-- Views Created:
-- ✓ users_stats
-- 
-- Features:
-- ✓ Email-based authentication
-- ✓ Role-based access control
-- ✓ Invite system
-- ✓ Audit logging
-- ✓ RLS policies
-- ✓ Auto-update triggers
-- 
-- Next Steps:
-- 1. Setup first superadmin (see PART 11)
-- 2. Configure Supabase Auth email templates
-- 3. Update Next.js app environment variables
-- 4. Test invite flow
-- ============================================================
