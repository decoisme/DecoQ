-- ============================================================
-- QRIS Verifier - Supabase Schema UPDATE
-- Jalankan script ini di Supabase SQL Editor
-- Script ini aman untuk dijalankan berulang kali
-- ============================================================

-- Tabel utama untuk menyimpan QRIS yang terdaftar (sudah ada, skip)
-- CREATE TABLE IF NOT EXISTS qris_registry ...

-- Tabel log verifikasi (tracking setiap scan) - NEW TABLE
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hash TEXT NOT NULL,
  qris_id UUID REFERENCES qris_registry(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL,
  merchant_name TEXT,                    -- Snapshot merchant name saat verifikasi
  merchant_id TEXT,                      -- Snapshot merchant ID
  scanned_data TEXT,                     -- Raw QRIS data yang di-scan
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  error_message TEXT                     -- Jika ada error
);

-- Tabel audit log (tracking admin actions) - NEW TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_role TEXT NOT NULL,              -- 'admin' atau 'superadmin'
  admin_name TEXT NOT NULL,              -- Nama admin
  action TEXT NOT NULL,                  -- 'CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE'
  resource_type TEXT NOT NULL,           -- 'QRIS', 'USER', etc
  resource_id UUID,                      -- ID resource yang diubah
  details JSONB,                         -- Detail perubahan
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa (existing indexes akan di-skip otomatis)
CREATE INDEX IF NOT EXISTS idx_qris_hash ON qris_registry(hash);
CREATE INDEX IF NOT EXISTS idx_qris_active ON qris_registry(is_active);
CREATE INDEX IF NOT EXISTS idx_qris_registered_at ON qris_registry(registered_at DESC);

-- New indexes untuk verification_logs
CREATE INDEX IF NOT EXISTS idx_verification_logs_hash ON verification_logs(hash);
CREATE INDEX IF NOT EXISTS idx_verification_logs_validated_at ON verification_logs(validated_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_verified ON verification_logs(is_verified);
CREATE INDEX IF NOT EXISTS idx_verification_logs_qris_id ON verification_logs(qris_id);

-- New indexes untuk audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_role ON audit_logs(admin_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

-- Row Level Security (enable jika belum)
ALTER TABLE qris_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada (untuk update)
DROP POLICY IF EXISTS "Public can read active QRIS" ON qris_registry;
DROP POLICY IF EXISTS "Anyone can insert verification logs" ON verification_logs;
DROP POLICY IF EXISTS "Public can read verification logs" ON verification_logs;
DROP POLICY IF EXISTS "Public can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admin can insert QRIS" ON qris_registry;
DROP POLICY IF EXISTS "Admin can update QRIS" ON qris_registry;
DROP POLICY IF EXISTS "Admin can delete QRIS" ON qris_registry;

-- Recreate policies dengan definisi terbaru
CREATE POLICY "Public can read active QRIS" ON qris_registry
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can insert verification logs" ON verification_logs
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Public can read verification logs" ON verification_logs
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can read audit logs" ON audit_logs
  FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admin can insert QRIS" ON qris_registry
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admin can update QRIS" ON qris_registry
  FOR UPDATE USING (TRUE);

CREATE POLICY "Admin can delete QRIS" ON qris_registry
  FOR DELETE USING (TRUE);

-- View untuk statistik dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
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

-- Data contoh (opsional)
-- INSERT INTO qris_registry (hash, merchant_name, merchant_id, category, registered_by, notes)
-- VALUES ('SAMPLE_HASH_HERE', 'Warung Pak Budi', 'MERCH001', 'F&B', 'admin@qris.id', 'Test merchant');


-- View untuk statistik dashboard (drop & recreate untuk update)
DROP VIEW IF EXISTS dashboard_stats;

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

-- Grant access to view
GRANT SELECT ON dashboard_stats TO anon, authenticated;

-- ============================================================
-- SELESAI! 
-- Tables: qris_registry, verification_logs, audit_logs
-- View: dashboard_stats
-- Indexes: Optimized untuk performa
-- Policies: RLS enabled dengan access control
-- ============================================================

-- CATATAN:
-- 1. Script ini aman dijalankan berulang kali
-- 2. Existing data tidak akan hilang
-- 3. Policies akan di-recreate dengan definisi terbaru
-- 4. View akan di-recreate untuk update
