-- ============================================================
-- RENAME qris_registry TO qris_database
-- ============================================================
-- This is the SIMPLEST solution - just rename the table!

-- ============================================================
-- STEP 1: Check current data
-- ============================================================

SELECT 'qris_registry' as table_name, COUNT(*) as total_rows
FROM qris_registry;

-- ============================================================
-- STEP 2: Rename table
-- ============================================================

ALTER TABLE qris_registry RENAME TO qris_database;

-- ============================================================
-- STEP 3: Rename indexes
-- ============================================================

-- Rename indexes to match new table name
ALTER INDEX IF EXISTS idx_qris_hash RENAME TO idx_qris_database_hash;
ALTER INDEX IF EXISTS idx_qris_active RENAME TO idx_qris_database_active;
ALTER INDEX IF EXISTS idx_qris_registered_at RENAME TO idx_qris_database_registered_at;

-- ============================================================
-- STEP 4: Update foreign key constraint name (optional)
-- ============================================================

-- The foreign key will still work, but we can rename it for consistency
ALTER TABLE verification_logs 
DROP CONSTRAINT IF EXISTS verification_logs_qris_id_fkey;

ALTER TABLE verification_logs 
ADD CONSTRAINT verification_logs_qris_id_fkey 
FOREIGN KEY (qris_id) REFERENCES qris_database(id) ON DELETE SET NULL;

-- ============================================================
-- STEP 5: Verify rename was successful
-- ============================================================

-- Check table exists with new name
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'qris_database';

-- Check data is still there
SELECT 'qris_database' as table_name, COUNT(*) as total_rows
FROM qris_database;

-- Check foreign key
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'verification_logs'
  AND kcu.column_name = 'qris_id';

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
-- DONE! ✅
-- ============================================================
-- Table qris_registry is now qris_database
-- All data preserved, no copying needed!
-- All foreign keys updated
-- ============================================================
