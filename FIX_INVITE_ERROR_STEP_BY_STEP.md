# 🔧 Fix "Database error saving new user" - Step by Step

## ❌ Masalah

Error: **"Database error saving new user"**

**Penyebab:** Kolom `status`, `invitation_token`, dan `invitation_expires_at` belum ada di database production.

---

## ✅ Solusi - Ikuti Langkah Ini:

### **STEP 1: Jalankan SQL Migration di Supabase**

1. Buka **Supabase Dashboard**: https://app.supabase.com
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy-paste script ini:

```sql
-- ============================================================
-- ADD PENDING STATUS FOR INVITED USERS
-- Safe migration that checks if columns exist first
-- ============================================================

-- Add status column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN status TEXT DEFAULT 'active' 
    CHECK (status IN ('pending', 'active', 'inactive'));
    
    RAISE NOTICE '✓ Column status added';
  ELSE
    RAISE NOTICE '✓ Column status already exists';
  END IF;
END $$;

-- Add invitation_token column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'invitation_token'
  ) THEN
    ALTER TABLE users ADD COLUMN invitation_token TEXT;
    RAISE NOTICE '✓ Column invitation_token added';
  ELSE
    RAISE NOTICE '✓ Column invitation_token already exists';
  END IF;
END $$;

-- Add invitation_expires_at column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'invitation_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN invitation_expires_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✓ Column invitation_expires_at added';
  ELSE
    RAISE NOTICE '✓ Column invitation_expires_at already exists';
  END IF;
END $$;

-- Update existing users to 'active' status
UPDATE users 
SET status = 'active' 
WHERE status IS NULL AND is_active = true;

-- Update existing inactive users
UPDATE users 
SET status = 'inactive' 
WHERE status IS NULL AND is_active = false;

-- Create indexes for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);

-- Verify changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('status', 'invitation_token', 'invitation_expires_at')
ORDER BY column_name;
```

6. Klik **Run** atau tekan `Ctrl+Enter`
7. Tunggu sampai selesai (akan muncul "Success")

**Expected Output:**
```
✓ Column status added
✓ Column invitation_token added
✓ Column invitation_expires_at added

column_name            | data_type                   | column_default | is_nullable
-----------------------|-----------------------------|-----------------|--------------
invitation_expires_at  | timestamp with time zone    | NULL           | YES
invitation_token       | text                        | NULL           | YES
status                 | text                        | 'active'       | YES
```

---

### **STEP 2: Update users_stats View**

Masih di **SQL Editor**, jalankan query ini:

```sql
-- ============================================================
-- UPDATE users_stats VIEW to include pending users
-- ============================================================

-- Drop existing view
DROP VIEW IF EXISTS users_stats;

-- Recreate view with pending users count
CREATE VIEW users_stats AS
SELECT
  COUNT(*) FILTER (WHERE users.role = 'superadmin' AND users.is_active = TRUE) as total_superadmins,
  COUNT(*) FILTER (WHERE users.role = 'admin' AND users.is_active = TRUE) as total_admins,
  COUNT(*) FILTER (WHERE users.is_active = TRUE) as total_active_users,
  COUNT(*) FILTER (WHERE users.is_active = FALSE AND COALESCE(users.status, 'active') != 'pending') as total_inactive_users,
  COUNT(*) FILTER (WHERE COALESCE(users.status, 'active') = 'pending') as total_pending_users,
  COUNT(*) as total_users
FROM users;

-- Grant access to view
GRANT SELECT ON users_stats TO authenticated, anon, service_role;

-- Test the view
SELECT * FROM users_stats;
```

**Expected Output:**
```
total_superadmins | total_admins | total_active_users | total_inactive_users | total_pending_users | total_users
------------------|--------------|--------------------|-----------------------|---------------------|-------------
1                 | 0            | 1                  | 0                     | 0                   | 1
```

---

### **STEP 3: Deploy Ulang ke Vercel**

```bash
# Di terminal lokal
npm run build

# Deploy ke production
vercel --prod
```

Atau push ke GitHub (jika auto-deploy):
```bash
git add .
git commit -m "fix: add status column for pending users"
git push origin main
```

---

### **STEP 4: Test Invite Admin**

1. Login ke dashboard: https://decoq.vercel.app/dashboard
2. Klik **Manage Admin** di sidebar
3. Klik **Invite Admin**
4. Isi form:
   - Email: `test@example.com`
   - Nama: `Test Admin`
   - Role: `Admin`
5. Klik **Send Invite**

**Expected Result:**
- ✅ "Invite berhasil dikirim ke test@example.com"
- ✅ Email terkirim
- ✅ Status di tabel: **⏳ Pending** (kuning)

---

### **STEP 5: Verifikasi Status di Panel Admin**

Di **Manage Admin**, Anda akan melihat:

**Statistik:**
```
┌─────────────┬─────────┬────────┬─────────┬──────────┐
│ Superadmin  │  Admin  │ Active │ Pending │ Inactive │
│      1      │    0    │   1    │    1    │    0     │
└─────────────┴─────────┴────────┴─────────┴──────────┘
```

**Tabel Users:**
| Email | Nama | Role | Status | Created |
|-------|------|------|--------|---------|
| test@example.com | Test Admin | Admin | **⏳ Pending** | 07 May 2026 |
| adeirie@decoq.com | - | Superadmin | **● Active** | 05 May 2026 |

---

## 🎯 Hasil Akhir

Setelah mengikuti semua step:

✅ Kolom `status`, `invitation_token`, `invitation_expires_at` ada di database  
✅ View `users_stats` include `total_pending_users`  
✅ Invite admin berhasil tanpa error  
✅ Status **Pending** muncul di panel admin  
✅ Email terkirim dengan link konfirmasi  
✅ Admin baru bisa aktivasi akun via email  

---

## 🐛 Troubleshooting

### Error masih muncul setelah run SQL?

**Cek apakah kolom sudah ada:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('status', 'invitation_token', 'invitation_expires_at');
```

Jika tidak ada output, berarti SQL belum jalan. Coba run ulang.

---

### Status tidak muncul di panel admin?

**Cek data di database:**
```sql
SELECT email, role, status, is_active, invitation_token
FROM users
ORDER BY invited_at DESC;
```

Jika kolom `status` NULL, run update:
```sql
UPDATE users SET status = 'active' WHERE is_active = true;
UPDATE users SET status = 'inactive' WHERE is_active = false;
```

---

### Email tidak terkirim?

Cek environment variables di Vercel:
- `USE_NODEMAILER=true`
- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=587`
- `EMAIL_USER=decoisme.works@gmail.com`
- `EMAIL_PASSWORD=xlhj jjxc vpad adfu`

Setelah update env vars, **redeploy**!

---

## 📞 Need Help?

Jika masih error, kirim screenshot:
1. Error message di browser
2. Output SQL query di Supabase
3. Vercel deployment logs

---

**Status:** ✅ **READY TO FIX**

**Last Updated:** May 7, 2026
