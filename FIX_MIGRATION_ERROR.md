# Fix: Migration Error - Column "created_at" Does Not Exist

## ❌ Error Message
```
ERROR: 42703: column "created_at" does not exist
LINE 86: COALESCE(created_at, registered_at) as created_at,
```

## ✅ Solution

Error terjadi karena tabel `qris_database` tidak punya kolom `created_at` dan `updated_at`. Saya sudah perbaiki migration script.

## 🚀 How to Fix - Step by Step

### Step 1: Check Current Situation

Jalankan script ini dulu untuk understand situasi Anda:

**File**: `CHECK_QRIS_TABLES.sql`

Script ini akan show:
- ✅ Tabel mana yang exist (`qris_registry` atau `qris_database`)
- ✅ Berapa banyak data di masing-masing tabel
- ✅ Kolom apa saja yang ada
- ✅ Sample data

**Possible Scenarios**:

#### Scenario A: Hanya `qris_database` yang ada ✅
```
table_name      | total_rows
----------------|------------
qris_database   | 10
```
**Action**: Tidak perlu migration! Sudah benar. Skip ke Step 3.

#### Scenario B: Hanya `qris_registry` yang ada
```
table_name      | total_rows
----------------|------------
qris_registry   | 10
```
**Action**: Perlu create `qris_database` dan copy data. Lanjut ke Step 2.

#### Scenario C: Kedua tabel ada tapi data berbeda
```
table_name      | total_rows
----------------|------------
qris_registry   | 10
qris_database   | 5
```
**Action**: Perlu merge data. Lanjut ke Step 2.

#### Scenario D: Kedua tabel ada dengan data sama
```
table_name      | total_rows
----------------|------------
qris_registry   | 10
qris_database   | 10
```
**Action**: Bisa langsung drop `qris_registry`. Lanjut ke Step 3.

### Step 2: Run Simple Migration

**File**: `MIGRATE_QRIS_SIMPLE.sql`

Script ini sudah diperbaiki dan akan:
1. ✅ Create `qris_database` jika belum ada
2. ✅ Copy data dari `qris_registry` (skip duplicates)
3. ✅ Update foreign key di `verification_logs`
4. ✅ Show verification results

**Important**: Script ini **TIDAK** akan drop `qris_registry` secara otomatis. Itu di-comment untuk safety.

### Step 3: Verify Everything Works

Test semua fitur:

#### 3.1 Test Dashboard
```
http://localhost:3000/dashboard
```
- ✅ Check QRIS Database tab
- ✅ Should show all QRIS entries

#### 3.2 Test Validation
```
http://localhost:3000/verify
```
- ✅ Scan QRIS yang sudah terdaftar
- ✅ Should return `verified: true`

#### 3.3 Test Registration
- ✅ Register QRIS baru di dashboard
- ✅ Should appear in QRIS Database tab
- ✅ Should be scannable in /verify

### Step 4: Drop Old Table (Optional)

Setelah verify semua works, bisa drop `qris_registry`:

```sql
-- ⚠️ WARNING: This is PERMANENT!
-- Only run after thorough testing!

DROP TABLE IF EXISTS qris_registry CASCADE;
```

## 📁 Files to Use

### For Checking:
- ✅ `CHECK_QRIS_TABLES.sql` - Check current situation

### For Migration:
- ✅ `MIGRATE_QRIS_SIMPLE.sql` - Simple migration (FIXED)
- ❌ `MIGRATE_QRIS_REGISTRY_TO_DATABASE.sql` - Old version (also fixed but more complex)

### For Documentation:
- ✅ `FIX_DUPLICATE_QRIS_TABLES.md` - Full explanation
- ✅ `FIX_MIGRATION_ERROR.md` - This file

## 🐛 What Was Wrong?

### Original Script:
```sql
CREATE TABLE qris_database (
  ...
  created_at TIMESTAMP,  -- ❌ This column doesn't exist in actual table
  updated_at TIMESTAMP   -- ❌ This column doesn't exist in actual table
);

INSERT INTO qris_database (..., created_at, updated_at)
SELECT ..., created_at, updated_at  -- ❌ Error here!
FROM qris_registry;
```

### Fixed Script:
```sql
CREATE TABLE qris_database (
  id UUID PRIMARY KEY,
  hash TEXT UNIQUE,
  merchant_name TEXT,
  merchant_id TEXT,
  category TEXT,
  registered_by TEXT,
  registered_at TIMESTAMP,  -- ✅ Only this timestamp
  is_active BOOLEAN,
  notes TEXT
  -- ✅ No created_at or updated_at
);

INSERT INTO qris_database (...)
SELECT ...  -- ✅ Only columns that exist
FROM qris_registry;
```

## ✅ Summary

| Step | Action | File |
|------|--------|------|
| 1 | Check situation | `CHECK_QRIS_TABLES.sql` |
| 2 | Run migration | `MIGRATE_QRIS_SIMPLE.sql` |
| 3 | Test everything | Manual testing |
| 4 | Drop old table | Manual SQL (optional) |

## 🎯 Expected Result

After migration:
- ✅ All data in `qris_database`
- ✅ All APIs use `qris_database`
- ✅ Dashboard shows correct data
- ✅ Validation works correctly
- ✅ No more duplicate tables

**Next**: Run `CHECK_QRIS_TABLES.sql` first to see your situation! 🚀
