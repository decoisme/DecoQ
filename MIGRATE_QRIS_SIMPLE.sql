-- ============================================================
-- SIMPLE MIGRATION: qris_registry → qris_database
-- ============================================================
-- Run this script step by step in Supabase SQL Editor

-- ============================================================
-- STEP 1: Check current situation
-- ============================================================

-- Check which tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('qris_registry', 'qris_database')
ORDER BY table_name;

-- ============================================================
-- STEP 2: Check data in each table
-- ============================================================

-- If qris_registry exists, check data
SELECT 'qris_registry' as table_name, COUNT(*) as total_rows
FROM qris_registry;

-- If qris_database exists, check data
SELECT 'qris_database' as table_name, COUNT(*) as total_rows
FROM qris_database;

-- ============================================================
-- STEP 3: Create qris_database if not exists
-- ============================================================

CREATE TABLE IF NOT EXISTS qris_database (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  merchant_name TEXT NOT NULL,
  merchant_id TEXT NOT NULL,
  category TEXT DEFAULT 'Umum',
  registered_by TEXT NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_qris_database_hash ON qris_database(hash);
CREATE INDEX IF NOT EXISTS idx_qris_database_active ON qris_database(is_active);
CREATE INDEX IF NOT EXISTS idx_qris_database_registered_at ON qris_database(registered_at DESC);

-- ============================================================
-- STEP 4: Copy data from qris_registry to qris_database
-- ============================================================

-- This will skip duplicates (ON CONFLICT DO NOTHING)
INSERT INTO qris_database (
  id,
  hash,
  merchant_name,
  merchant_id,
  category,
  registered_by,
  registered_at,
  is_active,
  notes
)
SELECT 
  id,
  hash,
  merchant_name,
  merchant_id,
  COALESCE(category, 'Umum'),
  registered_by,
  registered_at,
  COALESCE(is_active, true),
  notes
FROM qris_registry
ON CONFLICT (hash) DO NOTHING;

-- ============================================================
-- STEP 5: Verify migration
-- ============================================================

-- Compare counts
SELECT 'qris_registry' as source, COUNT(*) as rows FROM qris_registry
UNION ALL
SELECT 'qris_database' as destination, COUNT(*) as rows FROM qris_database;

-- Show sample data
SELECT 
  merchant_name,
  merchant_id,
  category,
  is_active,
  registered_at
FROM qris_database
ORDER BY registered_at DESC
LIMIT 5;

-- ============================================================
-- STEP 6: Update foreign key in verification_logs
-- ============================================================

-- Drop old constraint
ALTER TABLE verification_logs 
DROP CONSTRAINT IF EXISTS verification_logs_qris_id_fkey;

-- Add new constraint pointing to qris_database
ALTER TABLE verification_logs 
ADD CONSTRAINT verification_logs_qris_id_fkey 
FOREIGN KEY (qris_id) REFERENCES qris_database(id) ON DELETE SET NULL;

-- ============================================================
-- STEP 7: Drop old table (OPTIONAL - BE CAREFUL!)
-- ============================================================

-- ⚠️ Only run this after verifying everything works!
-- Uncomment the line below to drop qris_registry:

-- DROP TABLE IF EXISTS qris_registry CASCADE;

-- ============================================================
-- DONE! ✅
-- ============================================================
-- All APIs now use qris_database as single source of truth
-- ============================================================
