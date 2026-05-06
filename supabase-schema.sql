-- ============================================================
-- QRIS Verifier - Supabase Schema
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- Tabel utama untuk menyimpan QRIS yang terdaftar
CREATE TABLE IF NOT EXISTS qris_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,            -- SHA-256 hash dari raw QRIS string
  merchant_name TEXT NOT NULL,           -- Nama merchant
  merchant_id TEXT NOT NULL,             -- ID merchant
  category TEXT DEFAULT 'Umum',          -- Kategori bisnis
  registered_by TEXT NOT NULL,           -- Admin yang mendaftarkan
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

-- Tabel log verifikasi (tracking setiap scan)
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

-- Tabel audit log (tracking admin actions)
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

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_qris_hash ON qris_registry(hash);
CREATE INDEX IF NOT EXISTS idx_qris_active ON qris_registry(is_active);
CREATE INDEX IF NOT EXISTS idx_qris_registered_at ON qris_registry(registered_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_logs_hash ON verification_logs(hash);
CREATE INDEX IF NOT EXISTS idx_verification_logs_validated_at ON verification_logs(validated_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_verified ON verification_logs(is_verified);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_role ON audit_logs(admin_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Row Level Security
ALTER TABLE qris_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: semua bisa SELECT active QRIS (untuk validasi user)
CREATE POLICY "Public can read active QRIS" ON qris_registry
  FOR SELECT USING (is_active = TRUE);

-- Policy: semua bisa INSERT ke verification logs
CREATE POLICY "Anyone can insert verification logs" ON verification_logs
  FOR INSERT WITH CHECK (TRUE);

-- Policy: SELECT verification logs (untuk dashboard admin)
CREATE POLICY "Public can read verification logs" ON verification_logs
  FOR SELECT USING (TRUE);

-- Policy: SELECT audit logs (untuk dashboard admin)
CREATE POLICY "Public can read audit logs" ON audit_logs
  FOR SELECT USING (TRUE);

-- Policy: INSERT audit logs
CREATE POLICY "Anyone can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- Policy: INSERT qris_registry (pakai service_role dari admin panel)
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
