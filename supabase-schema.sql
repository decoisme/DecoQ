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

-- Tabel log validasi (audit trail)
CREATE TABLE IF NOT EXISTS validation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hash TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_qris_hash ON qris_registry(hash);
CREATE INDEX IF NOT EXISTS idx_qris_active ON qris_registry(is_active);
CREATE INDEX IF NOT EXISTS idx_logs_hash ON validation_logs(hash);

-- Row Level Security
ALTER TABLE qris_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: semua bisa SELECT (untuk validasi user)
CREATE POLICY "Public can read active QRIS" ON qris_registry
  FOR SELECT USING (is_active = TRUE);

-- Policy: semua bisa INSERT ke logs
CREATE POLICY "Anyone can insert logs" ON validation_logs
  FOR INSERT WITH CHECK (TRUE);

-- Policy: SELECT logs (opsional, bisa direstriksi)
CREATE POLICY "Public can read logs" ON validation_logs
  FOR SELECT USING (TRUE);

-- Policy: INSERT qris_registry (pakai service_role dari admin panel)
-- Di frontend admin, gunakan service_role key atau RLS bypass
CREATE POLICY "Admin can insert QRIS" ON qris_registry
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admin can update QRIS" ON qris_registry
  FOR UPDATE USING (TRUE);

-- Data contoh (opsional)
-- INSERT INTO qris_registry (hash, merchant_name, merchant_id, category, registered_by, notes)
-- VALUES ('SAMPLE_HASH_HERE', 'Warung Pak Budi', 'MERCH001', 'F&B', 'admin@qris.id', 'Test merchant');
