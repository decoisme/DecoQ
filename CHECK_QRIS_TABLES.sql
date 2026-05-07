-- ============================================================
-- CHECK QRIS TABLES STATUS
-- ============================================================
-- Run this first to understand your current situation

-- ============================================================
-- 1. Check which tables exist
-- ============================================================

SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name LIKE '%qris%'
ORDER BY table_name;

-- ============================================================
-- 2. Check qris_registry (if exists)
-- ============================================================

-- Count rows
SELECT 'qris_registry' as table_name, COUNT(*) as total_rows
FROM qris_registry;

-- Show columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'qris_registry'
ORDER BY ordinal_position;

-- Show sample data
SELECT * FROM qris_registry LIMIT 3;

-- ============================================================
-- 3. Check qris_database (if exists)
-- ============================================================

-- Count rows
SELECT 'qris_database' as table_name, COUNT(*) as total_rows
FROM qris_database;

-- Show columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'qris_database'
ORDER BY ordinal_position;

-- Show sample data
SELECT * FROM qris_database LIMIT 3;

-- ============================================================
-- 4. Compare data (if both exist)
-- ============================================================

-- Compare counts
SELECT 
  'qris_registry' as table_name, 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN is_active THEN 1 END) as active_rows
FROM qris_registry

UNION ALL

SELECT 
  'qris_database' as table_name, 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN is_active THEN 1 END) as active_rows
FROM qris_database;

-- ============================================================
-- 5. Check foreign key references
-- ============================================================

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'qris_registry' OR ccu.table_name = 'qris_database');

-- ============================================================
-- INTERPRETATION GUIDE
-- ============================================================

-- Scenario 1: Only qris_database exists
-- → No migration needed, you're good to go! ✅

-- Scenario 2: Only qris_registry exists
-- → Need to rename table or create qris_database and copy data

-- Scenario 3: Both exist with different data
-- → Need to merge data from qris_registry to qris_database

-- Scenario 4: Both exist with same data
-- → Can safely drop qris_registry after updating foreign keys

-- ============================================================
