-- ============================================================
-- QRIS Verifier - Schema UPDATE (Untuk Database yang Sudah Ada)
-- Jalankan script ini jika Anda sudah punya qris_registry table
-- Script ini hanya menambahkan table & view baru
-- ============================================================

-- 1. CREATE NEW TABLES
-- ============================================================

-- Tabel verification_logs (NEW)
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hash TEXT NOT NULL,
  qris_id UUID REFERENCES qris_registry(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL,
  merchant_name TEXT,
  merchant_id TEXT,
  scanned_data TEXT,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  error_message TEXT
);

-- Tabel audit_logs (NEW)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_role TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE INDEXES
-- ============================================================

-- Indexes untuk verification_logs
CREATE INDEX IF NOT EXISTS idx_verification_logs_hash ON verification_logs(hash);
CREATE INDEX IF NOT EXISTS idx_verification_logs_validated_at ON verification_logs(validated_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_verified ON verification_logs(is_verified);
CREATE INDEX IF NOT EXISTS idx_verification_logs_qris_id ON verification_logs(qris_id);

-- Indexes untuk audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_role ON audit_logs(admin_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

-- Indexes tambahan untuk qris_registry (jika belum ada)
CREATE INDEX IF NOT EXISTS idx_qris_registered_at ON qris_registry(registered_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES
-- ============================================================

-- Policies untuk verification_logs
DO $$ 
BEGIN
  -- Drop jika ada
  DROP POLICY IF EXISTS "Anyone can insert verification logs" ON verification_logs;
  DROP POLICY IF EXISTS "Public can read verification logs" ON verification_logs;
  
  -- Create policies
  CREATE POLICY "Anyone can insert verification logs" ON verification_logs
    FOR INSERT WITH CHECK (TRUE);
    
  CREATE POLICY "Public can read verification logs" ON verification_logs
    FOR SELECT USING (TRUE);
END $$;

-- Policies untuk audit_logs
DO $$ 
BEGIN
  -- Drop jika ada
  DROP POLICY IF EXISTS "Public can read audit logs" ON audit_logs;
  DROP POLICY IF EXISTS "Anyone can insert audit logs" ON audit_logs;
  
  -- Create policies
  CREATE POLICY "Public can read audit logs" ON audit_logs
    FOR SELECT USING (TRUE);
    
  CREATE POLICY "Anyone can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (TRUE);
END $$;

-- 5. CREATE VIEW
-- ============================================================

-- Drop existing view jika ada
DROP VIEW IF EXISTS dashboard_stats;

-- Create dashboard stats view
CREATE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM qris_registry WHERE is_active = TRUE) as total_active_qris,
  (SELECT COUNT(*) FROM qris_registry) as total_qris,
  (SELECT COUNT(*) FROM verification_logs) as total_verifications,
  (SELECT COUNT(*) FROM verification_logs WHERE is_verified = TRUE) as successful_verifications,
  (SELECT COUNT(*) FROM verification_logs WHERE validated_at >= NOW() - INTERVAL '24 hours') as verifications_today,
  (SELECT COUNT(*) FROM verification_logs WHERE validated_at >= NOW() - INTERVAL '7 days') as verifications_week,
  CASE 
    WHEN (SELECT COUNT(*) FROM verification_logs) > 0 
    THEN ROUND((SELECT COUNT(*) FROM verification_logs WHERE is_verified = TRUE)::NUMERIC / (SELECT COUNT(*) FROM verification_logs)::NUMERIC * 100, 2)
    ELSE 0
  END as success_rate;

-- Grant access
GRANT SELECT ON dashboard_stats TO anon, authenticated;

-- 6. VERIFICATION
-- ============================================================

-- Check tables created
SELECT 
  'verification_logs' as table_name,
  COUNT(*) as row_count
FROM verification_logs
UNION ALL
SELECT 
  'audit_logs' as table_name,
  COUNT(*) as row_count
FROM audit_logs
UNION ALL
SELECT 
  'qris_registry' as table_name,
  COUNT(*) as row_count
FROM qris_registry;

-- Check view created
SELECT * FROM dashboard_stats;

-- ============================================================
-- SELESAI! ✅
-- 
-- Tables Created:
-- ✓ verification_logs
-- ✓ audit_logs
-- 
-- View Created:
-- ✓ dashboard_stats
-- 
-- Indexes: Optimized
-- Policies: Configured
-- ============================================================
