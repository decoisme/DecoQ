# Fix: Duplicate QRIS Tables (qris_registry vs qris_database)

## ✅ Status: FIXED

Masalah duplikasi tabel QRIS telah diperbaiki. Semua API sekarang menggunakan **`qris_database`** sebagai satu-satunya tabel QRIS.

## 🐛 Problem Identified

Ada **2 tabel berbeda** yang digunakan untuk menyimpan data QRIS:

### 1. `qris_registry` (OLD)
**Digunakan di**:
- ❌ `/api/validate` - Validasi QRIS scan
- ❌ Schema lama (`supabase-schema.sql`)
- ❌ Dokumentasi lama

### 2. `qris_database` (NEW)
**Digunakan di**:
- ✅ `/api/list` - List QRIS
- ✅ `/api/register` - Register QRIS baru
- ✅ `/api/dashboard-stats` - Dashboard statistics
- ✅ Dashboard baru (`/dashboard`)
- ✅ Admin page (`/admin`)

**Result**: Data QRIS yang terdaftar di `/admin` dan `/dashboard` **berbeda** karena menggunakan tabel yang berbeda!

## 🔧 Solution

### Decision: Use `qris_database` as Single Source of Truth

**Why `qris_database`?**
- ✅ Digunakan di semua API baru (list, register, stats)
- ✅ Digunakan di dashboard baru
- ✅ Nama lebih deskriptif
- ✅ Sudah ada RLS policies

### Changes Made:

#### 1. **Updated `/api/validate`** ✅
**File**: `pages/api/validate.ts`

**Changed**:
```typescript
// OLD
.from('qris_registry')

// NEW
.from('qris_database')
```

#### 2. **Created Migration Script** ✅
**File**: `MIGRATE_QRIS_REGISTRY_TO_DATABASE.sql`

**Features**:
- ✅ Check if both tables exist
- ✅ Compare data counts
- ✅ Create `qris_database` if not exists
- ✅ Migrate all data from `qris_registry` to `qris_database`
- ✅ Update foreign key in `verification_logs`
- ✅ Verify migration success
- ✅ Drop old `qris_registry` table (optional, commented out)

## 🚀 How to Fix

### Step 1: Run Migration Script

Open **Supabase SQL Editor** and run **`MIGRATE_QRIS_REGISTRY_TO_DATABASE.sql`**

This will:
1. Check if both tables exist
2. Create `qris_database` if needed
3. Copy all data from `qris_registry` to `qris_database`
4. Update foreign key references
5. Show verification results

### Step 2: Verify Migration

Check the output:
```sql
-- Should show same row count
qris_registry    | 10
qris_database    | 10

-- Should show sample data
id | merchant_name | merchant_id | category | is_active | registered_at
```

### Step 3: Test All Features

1. **Test Validation** (`/verify`):
   - Scan QRIS yang sudah terdaftar
   - Should return `verified: true`

2. **Test Dashboard** (`/dashboard`):
   - Check QRIS Database tab
   - Should show all QRIS entries

3. **Test Admin** (`/admin`):
   - Check list tab
   - Should show same data as dashboard

4. **Test Registration**:
   - Register new QRIS
   - Should appear in both dashboard and admin

### Step 4: Drop Old Table (Optional)

After verifying everything works, you can drop `qris_registry`:

```sql
-- ⚠️ WARNING: This is permanent!
DROP TABLE IF EXISTS qris_registry CASCADE;
```

**Note**: The migration script has this commented out for safety. Only uncomment after thorough testing!

## 📊 Table Comparison

| Feature | qris_registry | qris_database |
|---------|---------------|---------------|
| Used in validate API | ❌ (was) → ✅ (now) | ✅ |
| Used in list API | ❌ | ✅ |
| Used in register API | ❌ | ✅ |
| Used in dashboard | ❌ | ✅ |
| Used in admin | ❌ | ✅ |
| Has RLS policies | ❌ | ✅ |
| Has indexes | ✅ | ✅ |
| Foreign keys | ✅ | ✅ (after migration) |

## 🔍 Verification Checklist

After migration, verify:

- ✅ `/api/validate` uses `qris_database`
- ✅ `/api/list` uses `qris_database`
- ✅ `/api/register` uses `qris_database`
- ✅ `/api/dashboard-stats` uses `qris_database`
- ✅ Dashboard shows correct data
- ✅ Admin page shows same data as dashboard
- ✅ Scan validation works correctly
- ✅ Registration works correctly
- ✅ No console errors

## 🐛 Troubleshooting

### If migration fails:

1. **Check if qris_registry exists:**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'qris_registry';
   ```

2. **Check if data exists:**
   ```sql
   SELECT COUNT(*) FROM qris_registry;
   ```

3. **Manual migration:**
   ```sql
   INSERT INTO qris_database 
   SELECT * FROM qris_registry
   ON CONFLICT (hash) DO NOTHING;
   ```

### If validation still fails:

1. **Check which table has data:**
   ```sql
   SELECT 'qris_registry' as table_name, COUNT(*) FROM qris_registry
   UNION ALL
   SELECT 'qris_database' as table_name, COUNT(*) FROM qris_database;
   ```

2. **Check if hash exists:**
   ```sql
   SELECT * FROM qris_database WHERE hash = 'YOUR_HASH_HERE';
   ```

3. **Check API logs:**
   - Look for "table does not exist" errors
   - Check which table is being queried

## 📁 Files Modified

### Code Changes:
- ✅ `pages/api/validate.ts` - Changed from `qris_registry` to `qris_database`

### SQL Scripts Created:
- ✅ `MIGRATE_QRIS_REGISTRY_TO_DATABASE.sql` - Migration script
- ✅ `FIX_DUPLICATE_QRIS_TABLES.md` - This documentation

### No Changes Needed (Already Using qris_database):
- ✅ `pages/api/list.ts`
- ✅ `pages/api/register.ts`
- ✅ `pages/api/dashboard-stats.ts`
- ✅ `pages/dashboard.tsx`
- ✅ `pages/admin.tsx`

## ✅ Build Status

```bash
npm run build
```

**Result**: ✅ **SUCCESS** - No TypeScript errors

## 🎯 Summary

| Issue | Status |
|-------|--------|
| Duplicate tables identified | ✅ Fixed |
| Migration script created | ✅ Done |
| API updated to use qris_database | ✅ Done |
| Build passing | ✅ Success |
| Ready for testing | ✅ Yes |

**Next Steps**:
1. Run `MIGRATE_QRIS_REGISTRY_TO_DATABASE.sql` in Supabase
2. Verify migration success
3. Test all features
4. Drop old `qris_registry` table (optional)

**Result**: Semua API sekarang menggunakan **`qris_database`** sebagai single source of truth! 🚀
