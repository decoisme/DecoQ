# 🔍 Kenapa Database Sebelumnya Hilang?

## ❓ Pertanyaan

"Kenapa database sebelumnya hilang ya?"

---

## 🎯 Kemungkinan Penyebab

### **1. Migration Script Menghapus Data Lama**

File `supabase-auth-migration-safe.sql` membuat table baru (`users`, `auth_logs`) tapi **tidak migrate data lama**.

**Table lama yang mungkin hilang:**
- `qris_database` (QRIS entries)
- `validation_logs` (verification logs)
- `audit_logs` (admin actions)

**Solusi:** Data lama masih ada, tapi mungkin tidak terlihat karena RLS policies.

---

### **2. RLS Policies Memblokir Akses**

Setelah fix RLS policies, mungkin ada policies yang memblokir akses ke table lama.

**Check dengan SQL:**
```sql
-- Cek apakah data QRIS masih ada
SELECT COUNT(*) as total_qris FROM qris_database;

-- Cek apakah validation logs masih ada
SELECT COUNT(*) as total_logs FROM validation_logs;

-- Cek apakah audit logs masih ada
SELECT COUNT(*) as total_audit FROM audit_logs;
```

**Jika COUNT > 0:** Data masih ada, hanya tidak terlihat karena RLS.

---

### **3. Table Tidak Terhubung dengan Auth System Baru**

Table lama (`qris_database`, `validation_logs`, `audit_logs`) mungkin tidak punya kolom `auth_user_id` atau tidak terhubung dengan sistem auth baru.

**Check schema:**
```sql
-- Cek kolom di qris_database
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'qris_database';

-- Cek apakah ada kolom auth_user_id atau user_id
```

---

### **4. Supabase Project Berbeda**

Kemungkinan Anda menggunakan **Supabase project berbeda** dari sebelumnya.

**Check:**
1. Buka `.env.local`
2. Check `NEXT_PUBLIC_SUPABASE_URL`
3. Apakah URL-nya sama dengan project sebelumnya?

**Jika berbeda:** Data ada di project lama, bukan di project baru.

---

## ✅ Cara Cek Data Masih Ada atau Tidak

### **Step 1: Cek Semua Tables**

```sql
-- List semua tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected output:**
```
table_name
-----------------
audit_logs
auth_logs
qris_database
users
validation_logs
```

---

### **Step 2: Cek Jumlah Data di Setiap Table**

```sql
-- Count data di semua tables
SELECT 
  'qris_database' as table_name,
  COUNT(*) as total_rows
FROM qris_database
UNION ALL
SELECT 
  'validation_logs',
  COUNT(*)
FROM validation_logs
UNION ALL
SELECT 
  'audit_logs',
  COUNT(*)
FROM audit_logs
UNION ALL
SELECT 
  'users',
  COUNT(*)
FROM users
UNION ALL
SELECT 
  'auth_logs',
  COUNT(*)
FROM auth_logs;
```

**Expected output:**
```
table_name        | total_rows
------------------|------------
qris_database     | 10
validation_logs   | 50
audit_logs        | 20
users             | 2
auth_logs         | 5
```

**Jika total_rows > 0:** Data masih ada! ✅

---

### **Step 3: Cek Sample Data**

```sql
-- Sample data dari qris_database
SELECT 
  id,
  merchant_name,
  merchant_id,
  is_active,
  registered_at
FROM qris_database
ORDER BY registered_at DESC
LIMIT 5;
```

**Jika ada output:** Data masih ada dan bisa diakses! ✅

---

## 🔧 Solusi Jika Data Hilang

### **Solusi 1: Fix RLS Policies untuk Table Lama**

```sql
-- Disable RLS untuk table lama (temporary)
ALTER TABLE qris_database DISABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Atau create simple policies
CREATE POLICY "Allow authenticated users to read qris" ON qris_database
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read validation_logs" ON validation_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read audit_logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);
```

---

### **Solusi 2: Restore dari Backup**

Jika data benar-benar hilang:

1. **Buka Supabase Dashboard**
2. **Database** → **Backups**
3. **Restore** dari backup terakhir sebelum migration

---

### **Solusi 3: Migrate Data dari Project Lama**

Jika menggunakan project berbeda:

1. **Export data** dari project lama:
   ```sql
   -- Di project lama, export data
   COPY qris_database TO '/tmp/qris_backup.csv' CSV HEADER;
   COPY validation_logs TO '/tmp/logs_backup.csv' CSV HEADER;
   ```

2. **Import data** ke project baru:
   ```sql
   -- Di project baru, import data
   COPY qris_database FROM '/tmp/qris_backup.csv' CSV HEADER;
   COPY validation_logs FROM '/tmp/logs_backup.csv' CSV HEADER;
   ```

---

## 🎯 Quick Check

**Run query ini untuk quick check:**

```sql
-- Quick check: Apakah data masih ada?
SELECT 
  'QRIS Database' as check_item,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data masih ada'
    ELSE '❌ Data hilang'
  END as status
FROM qris_database
UNION ALL
SELECT 
  'Validation Logs',
  COUNT(*),
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data masih ada'
    ELSE '❌ Data hilang'
  END
FROM validation_logs
UNION ALL
SELECT 
  'Audit Logs',
  COUNT(*),
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data masih ada'
    ELSE '❌ Data hilang'
  END
FROM audit_logs;
```

**Expected output:**
```
check_item        | total | status
------------------|-------|------------------
QRIS Database     | 10    | ✅ Data masih ada
Validation Logs   | 50    | ✅ Data masih ada
Audit Logs        | 20    | ✅ Data masih ada
```

---

## 📝 Summary

**Kemungkinan besar data TIDAK hilang**, hanya:
1. ❌ RLS policies memblokir akses
2. ❌ Table tidak terhubung dengan auth system baru
3. ❌ Menggunakan Supabase project berbeda

**Solusi:**
1. ✅ Run query check di atas
2. ✅ Fix RLS policies jika perlu
3. ✅ Share hasil query untuk troubleshooting lebih lanjut

**Run query check dan share hasilnya!** 🔍

