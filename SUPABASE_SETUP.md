# 🗄️ Supabase Setup Guide

## 🚨 Jika Anda Mendapat Error "policy already exists"

Gunakan file SQL yang sesuai dengan kondisi database Anda:

---

## 📋 Pilih File SQL yang Tepat:

### ✅ **Opsi 1: Database Baru (Fresh Install)**

Jika Anda **belum pernah** menjalankan schema sebelumnya:

**File:** `supabase-schema.sql`

**Cara:**
1. Buka Supabase Dashboard
2. Klik **SQL Editor**
3. Klik **New Query**
4. Copy-paste isi file `supabase-schema.sql`
5. Klik **Run**

**Hasil:**
- ✅ Table `qris_registry` dibuat
- ✅ Table `verification_logs` dibuat
- ✅ Table `audit_logs` dibuat
- ✅ View `dashboard_stats` dibuat
- ✅ Indexes dibuat
- ✅ Policies dibuat

---

### ✅ **Opsi 2: Database Sudah Ada (Update)**

Jika Anda **sudah punya** table `qris_registry` dan mendapat error policy:

**File:** `supabase-schema-update.sql`

**Cara:**
1. Buka Supabase Dashboard
2. Klik **SQL Editor**
3. Klik **New Query**
4. Copy-paste isi file `supabase-schema-update.sql`
5. Klik **Run**

**Hasil:**
- ✅ Table `verification_logs` ditambahkan
- ✅ Table `audit_logs` ditambahkan
- ✅ View `dashboard_stats` dibuat
- ✅ Indexes ditambahkan
- ✅ Policies dibuat (dengan DO block untuk avoid error)

---

## 🔍 Verifikasi Setup

Setelah menjalankan SQL, verifikasi dengan query ini:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qris_registry', 'verification_logs', 'audit_logs');

-- Check view
SELECT * FROM dashboard_stats;

-- Check row counts
SELECT 
  'qris_registry' as table_name, COUNT(*) as rows FROM qris_registry
UNION ALL
SELECT 
  'verification_logs' as table_name, COUNT(*) as rows FROM verification_logs
UNION ALL
SELECT 
  'audit_logs' as table_name, COUNT(*) as rows FROM audit_logs;
```

**Expected Output:**
```
table_name          | rows
--------------------|------
qris_registry       | X
verification_logs   | 0
audit_logs          | 0
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"
**Solusi:** Ini normal, `CREATE TABLE IF NOT EXISTS` akan skip table yang sudah ada.

### Error: "policy already exists"
**Solusi:** Gunakan `supabase-schema-update.sql` yang menggunakan `DO` block untuk drop & recreate.

### Error: "permission denied"
**Solusi:** 
1. Pastikan Anda login sebagai owner project
2. Atau gunakan service_role key di API

### View tidak muncul
**Solusi:**
```sql
-- Drop & recreate view
DROP VIEW IF EXISTS dashboard_stats;
CREATE VIEW dashboard_stats AS ...
```

### Stats menunjukkan 0 semua
**Solusi:** Ini normal jika belum ada data. Coba:
1. Daftarkan QRIS di `/admin`
2. Scan QRIS di `/verify`
3. Refresh dashboard

---

## 📊 Test Data (Optional)

Jika ingin test dengan sample data:

```sql
-- Insert sample QRIS
INSERT INTO qris_registry (hash, merchant_name, merchant_id, category, registered_by, notes)
VALUES 
  ('sample_hash_1', 'Warung Pak Budi', 'MERCH001', 'F&B', 'admin', 'Test merchant 1'),
  ('sample_hash_2', 'Toko Ibu Ani', 'MERCH002', 'Retail', 'admin', 'Test merchant 2');

-- Insert sample verification log
INSERT INTO verification_logs (hash, qris_id, is_verified, merchant_name, merchant_id, user_agent, ip_address)
SELECT 
  hash, 
  id, 
  true, 
  merchant_name, 
  merchant_id,
  'Mozilla/5.0 Test',
  '127.0.0.1'
FROM qris_registry 
LIMIT 1;

-- Insert sample audit log
INSERT INTO audit_logs (admin_role, admin_name, action, resource_type, details)
VALUES 
  ('superadmin', 'Admin Test', 'CREATE', 'QRIS', '{"merchant": "Test"}');

-- Check stats
SELECT * FROM dashboard_stats;
```

---

## 🔐 Security Check

Pastikan RLS (Row Level Security) enabled:

```sql
-- Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('qris_registry', 'verification_logs', 'audit_logs');
```

**Expected:** `rowsecurity = true` untuk semua table

---

## 🚀 Next Steps

Setelah database setup selesai:

1. ✅ Update `.env.local` dengan Supabase credentials
2. ✅ Run `npm run dev`
3. ✅ Buka `http://localhost:3000/dashboard`
4. ✅ Login dengan `superadmin123`
5. ✅ Test semua fitur

---

## 📞 Need Help?

Jika masih ada masalah:

1. **Check Supabase Logs:**
   - Dashboard → Logs → API Logs
   - Lihat error messages

2. **Check Browser Console:**
   - F12 → Console
   - Lihat API errors

3. **Check Network Tab:**
   - F12 → Network
   - Filter: Fetch/XHR
   - Lihat failed requests

4. **Common Issues:**
   - ❌ Wrong API keys → Check `.env.local`
   - ❌ RLS blocking → Check policies
   - ❌ CORS error → Check Supabase settings
   - ❌ 401 Unauthorized → Check admin key

---

## 📝 Schema Summary

### Tables:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `qris_registry` | Store registered QRIS | hash, merchant_name, is_active |
| `verification_logs` | Track scan results | hash, is_verified, validated_at |
| `audit_logs` | Track admin actions | admin_role, action, created_at |

### View:

| View | Purpose | Returns |
|------|---------|---------|
| `dashboard_stats` | Aggregated statistics | total_qris, success_rate, etc |

### Indexes:

- Hash lookups: `idx_qris_hash`, `idx_verification_logs_hash`
- Time-based queries: `idx_*_validated_at`, `idx_*_created_at`
- Filtering: `idx_qris_active`, `idx_verification_logs_verified`

---

**Happy Coding! 🎉**
