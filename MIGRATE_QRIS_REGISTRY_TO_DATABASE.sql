-- ============================================================
-- MIGRATE FROM qris_registry TO qris_database
-- ============================================================
-- This script migrates all data from qris_registry to qris_database
-- and removes the old qris_registry table

-- ============================================================
-- STEP 1: Check if both tables exist
-- ============================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('qris_registry', 'qris_database')
ORDER BY table_name;

-- ============================================================
-- STEP 2: Check data counts
-- ============================================================

-- Count data in qris_registry (old table)
SELECT 'qris_registry' as table_name, COUNT(*) as total_rows
FROM qris_registry
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qris_registry')

UNION ALL

-- Count data in qris_database (new table)
SELECT 'qris_database' as table_name, COUNT(*) as total_rows
FROM qris_database
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qris_database');

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
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_qris_database_hash ON qris_database(hash);
CREATE INDEX IF NOT EXISTS idx_qris_database_active ON qris_database(is_active);
CREATE INDEX IF NOT EXISTS idx_qris_database_registered_at ON qris_database(registered_at DESC);

-- ============================================================
-- STEP 4: Migrate data from qris_registry to qris_database
-- ============================================================

-- Only migrate if qris_registry exists and has data
INSERT INTO qris_database (
  id,
  hash,
  merchant_name,
  merchant_id,
  category,
  registered_by,
  registered_at,
  is_active,
  notes,
  created_at,
  updated_at
)
SELECT 
  id,
  hash,
  merchant_name,
  merchant_id,
  category,
  registered_by,
  registered_at,
  is_active,
  notes,
  COALESCE(created_at, registered_at) as created_at,
  COALESCE(updated_at, registered_at) as updated_at
FROM qris_registry
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qris_registry')
ON CONFLICT (hash) DO NOTHING; -- Skip duplicates

-- ============================================================
-- STEP 5: Update foreign key references in verification_logs
-- ============================================================

-- Check if verification_logs has qris_id column referencing qris_registry
DO $$
BEGIN
  -- Drop old foreign key constraint if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'verification_logs_qris_id_fkey'
  ) THEN
    ALTER TABLE verification_logs DROP CONSTRAINT verification_logs_qris_id_fkey;
  END IF;

  -- Add new foreign key constraint to qris_database
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qris_database') THEN
    ALTER TABLE verification_logs 
    ADD CONSTRAINT verification_logs_qris_id_fkey 
    FOREIGN KEY (qris_id) REFERENCES qris_database(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- STEP 6: Verify migration
-- ============================================================

-- Compare counts
SELECT 
  'qris_registry' as source_table,
  COUNT(*) as total_rows
FROM qris_registry
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qris_registry')

UNION ALL

SELECT 
  'qris_database' as destination_table,
  COUNT(*) as total_rows
FROM qris_database;

-- Show sample data from qris_database
SELECT 
  id,
  merchant_name,
  merchant_id,
  category,
  is_active,
  registered_at
FROM qris_database
ORDER BY registered_at DESC
LIMIT 5;

-- ============================================================
-- STEP 7: Drop old qris_registry table (CAREFUL!)
-- ============================================================

-- ⚠️ WARNING: This will permanently delete qris_registry table
-- Only run this after verifying migration was successful!

-- Uncomment the line below to drop qris_registry:
-- DROP TABLE IF EXISTS qris_registry CASCADE;

-- ============================================================
-- VERIFICATION CHECKLIST
-- ============================================================

-- ✅ Check 1: Both tables have same row count
-- ✅ Check 2: Sample data looks correct in qris_database
-- ✅ Check 3: Foreign key updated in verification_logs
-- ✅ Check 4: All APIs use qris_database (not qris_registry)
-- ✅ Check 5: Dashboard shows correct data

-- After all checks pass, uncomment and run:
-- DROP TABLE IF EXISTS qris_registry CASCADE;

-- ============================================================
-- ROLLBACK (if needed)
-- ============================================================

-- If something goes wrong, you can restore from qris_registry:
-- 
-- TRUNCATE qris_database;
-- 
-- INSERT INTO qris_database SELECT * FROM qris_registry;
-- 
-- But only if you haven't dropped qris_registry yet!
-- ============================================================
