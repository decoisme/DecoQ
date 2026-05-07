# Solution: Rename qris_registry to qris_database

## ✅ Your Situation (From Screenshot)

Based on the foreign key check, you have:
- ✅ Table `qris_registry` exists with data
- ✅ Foreign key: `verification_logs.qris_id` → `qris_registry.id`
- ❌ Table `qris_database` doesn't exist (or is empty)

**This is Scenario B**: Only `qris_registry` exists

## 🎯 Best Solution: RENAME (Not Copy!)

Instead of copying data, we'll simply **rename** the table. This is:
- ✅ **Faster** - No data copying
- ✅ **Safer** - No risk of data loss
- ✅ **Simpler** - One command
- ✅ **Preserves everything** - IDs, timestamps, relationships

## 🚀 How to Fix

### Run This Script:

**File**: `RENAME_QRIS_TABLE.sql`

Open Supabase SQL Editor and run the entire script. It will:

1. ✅ Check current data count
2. ✅ Rename `qris_registry` → `qris_database`
3. ✅ Rename indexes to match
4. ✅ Update foreign key constraint
5. ✅ Verify everything worked
6. ✅ Show sample data

### Expected Output:

```
-- Step 1: Current data
qris_registry | 10 rows

-- Step 2: Rename (no output, just success)

-- Step 3: Rename indexes (no output, just success)

-- Step 4: Update foreign key (no output, just success)

-- Step 5: Verification
table_name: qris_database ✅

qris_database | 10 rows ✅

foreign_table_name: qris_database ✅

Sample data:
merchant_name | merchant_id | category | is_active | registered_at
...
```

## ✅ After Running Script

### Test Everything:

#### 1. Dashboard
```
http://localhost:3000/dashboard
```
- Go to "QRIS Database" tab
- Should show all your QRIS entries ✅

#### 2. Validation
```
http://localhost:3000/verify
```
- Scan a registered QRIS
- Should return `verified: true` ✅

#### 3. Registration
- Register a new QRIS in dashboard
- Should appear in QRIS Database tab ✅
- Should be scannable in /verify ✅

#### 4. Admin Page
```
http://localhost:3000/admin
```
- Should show same data as dashboard ✅

## 🔍 Verify in Database

After running the script, you can verify:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'qris_database';
-- Should return: qris_database

-- Check old table is gone
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'qris_registry';
-- Should return: (empty)

-- Check data
SELECT COUNT(*) FROM qris_database;
-- Should return: same count as before

-- Check foreign key
SELECT ccu.table_name 
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'verification_logs'
  AND tc.constraint_type = 'FOREIGN KEY';
-- Should return: qris_database
```

## 📊 What Changed

| Before | After |
|--------|-------|
| Table: `qris_registry` | Table: `qris_database` |
| Index: `idx_qris_hash` | Index: `idx_qris_database_hash` |
| Index: `idx_qris_active` | Index: `idx_qris_database_active` |
| FK: → `qris_registry` | FK: → `qris_database` |

## 🎯 Why This Works

### All APIs Already Updated:
- ✅ `/api/validate` - Uses `qris_database` (we changed this)
- ✅ `/api/list` - Uses `qris_database` (already correct)
- ✅ `/api/register` - Uses `qris_database` (already correct)
- ✅ `/api/dashboard-stats` - Uses `qris_database` (already correct)

### After Rename:
- ✅ Table name matches what APIs expect
- ✅ All data preserved (same IDs, timestamps, etc.)
- ✅ Foreign keys still work
- ✅ No duplicate data
- ✅ No migration needed

## ⚠️ Important Notes

1. **Backup First** (Optional but Recommended):
   ```sql
   -- Create backup table
   CREATE TABLE qris_registry_backup AS 
   SELECT * FROM qris_registry;
   ```

2. **Run During Low Traffic**:
   - Rename is fast but locks the table briefly
   - Best to run when no one is using the app

3. **Can't Undo Easily**:
   - Once renamed, old name is gone
   - But you can rename back if needed:
     ```sql
     ALTER TABLE qris_database RENAME TO qris_registry;
     ```

## 🐛 Troubleshooting

### If rename fails:

**Error**: "table qris_database already exists"
```sql
-- Check if qris_database exists
SELECT COUNT(*) FROM qris_database;

-- If it's empty, drop it first
DROP TABLE qris_database;

-- Then run rename again
ALTER TABLE qris_registry RENAME TO qris_database;
```

**Error**: "cannot rename because of dependent objects"
```sql
-- This shouldn't happen, but if it does:
-- The script handles foreign keys automatically
-- Just run the full RENAME_QRIS_TABLE.sql script
```

## ✅ Summary

| Step | Action | File |
|------|--------|------|
| 1 | Run rename script | `RENAME_QRIS_TABLE.sql` |
| 2 | Verify in database | SQL queries above |
| 3 | Test dashboard | Manual testing |
| 4 | Test validation | Manual testing |
| 5 | Done! | ✅ |

**Result**: 
- ✅ Single table: `qris_database`
- ✅ All data preserved
- ✅ All APIs work correctly
- ✅ No duplicate tables
- ✅ No migration needed

**Next**: Run `RENAME_QRIS_TABLE.sql` in Supabase SQL Editor! 🚀
