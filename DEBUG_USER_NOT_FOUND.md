# 🐛 Fix: "User tidak ditemukan dalam sistem"

## ❓ Penyebab Error

Error ini muncul karena:
1. ✅ User **sudah dibuat** di `auth.users` (Supabase Auth)
2. ❌ User **belum di-insert** ke table `users` (aplikasi)

Login page mengecek apakah user ada di table `users` setelah auth berhasil.

---

## ✅ Solusi: Insert User ke Table `users`

### Step 1: Get Auth User ID

1. Buka **Supabase Dashboard**
2. Klik **Authentication** → **Users**
3. Cari user dengan email Anda (contoh: `superadmin@decoq.com`)
4. **Klik pada user** untuk melihat detail
5. **Copy "ID"** (UUID format)

   ```
   User Details
   ├─ ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890  ← Copy ini
   ├─ Email: superadmin@decoq.com
   ├─ Email Confirmed: true
   └─ Created: 2024-01-01 12:00:00
   ```

---

### Step 2: Insert ke Users Table

1. Buka **SQL Editor** di Supabase
2. **Run query ini** (ganti `auth_user_id` dan `email`):

```sql
-- Insert user ke users table
INSERT INTO users (
  email, 
  role, 
  full_name, 
  auth_user_id, 
  is_active
)
VALUES (
  'superadmin@decoq.com',           -- GANTI: Email Anda (yang sama dengan auth.users)
  'superadmin',                      -- Role: superadmin
  'Super Admin',                     -- Nama lengkap (optional)
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- GANTI: ID dari Step 1
  TRUE                               -- Active
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'superadmin', 
  auth_user_id = EXCLUDED.auth_user_id, 
  is_active = TRUE;

-- Verify
SELECT * FROM users WHERE email = 'superadmin@decoq.com';
```

**Expected Output:**
```
id       | email                  | role       | auth_user_id                         | is_active
---------|------------------------|------------|--------------------------------------|----------
uuid...  | superadmin@decoq.com   | superadmin | a1b2c3d4-e5f6-7890-abcd-ef1234567890 | true
```

---

### Step 3: Test Login

1. **Buka**: http://localhost:3000/auth/login
2. **Login dengan:**
   - Email: `superadmin@decoq.com`
   - Password: (password yang Anda set)
3. **Klik "Login"**
4. **✅ Berhasil!** Redirect ke dashboard

---

## 🔍 Troubleshooting

### Issue: "Masih error 'User tidak ditemukan'"

**Check 1: Apakah user ada di users table?**
```sql
SELECT * FROM users WHERE email = 'superadmin@decoq.com';
```

**Jika kosong:**
- Run INSERT query dari Step 2 lagi
- Pastikan `auth_user_id` benar (copy dari Supabase Dashboard)

---

### Issue: "auth_user_id tidak match"

**Check 2: Apakah auth_user_id sama?**
```sql
-- Check auth.users
SELECT id, email FROM auth.users WHERE email = 'superadmin@decoq.com';

-- Check users table
SELECT auth_user_id, email FROM users WHERE email = 'superadmin@decoq.com';

-- Keduanya harus SAMA!
```

**Jika berbeda:**
```sql
-- Update auth_user_id di users table
UPDATE users 
SET auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'superadmin@decoq.com'
)
WHERE email = 'superadmin@decoq.com';
```

---

### Issue: "Table users does not exist"

**Cause:** Database migration belum dijalankan

**Solution:**
```sql
-- Run migration script
-- Copy-paste isi file: supabase-auth-migration-safe.sql
-- Atau run via Supabase SQL Editor
```

---

## 🎯 Quick Fix (One-Liner)

Jika Anda sudah tahu email dan auth_user_id:

```sql
-- Replace values dan run
INSERT INTO users (email, role, full_name, auth_user_id, is_active)
VALUES ('superadmin@decoq.com', 'superadmin', 'Super Admin', 'YOUR_AUTH_USER_ID_HERE', TRUE)
ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id, is_active = TRUE;
```

---

## 📋 Verification Checklist

Sebelum login, pastikan:

- [ ] User ada di `auth.users` (check via Supabase Dashboard → Authentication → Users)
- [ ] User ada di `users` table (check via SQL: `SELECT * FROM users WHERE email = '...'`)
- [ ] `auth_user_id` di `users` table **sama** dengan `id` di `auth.users`
- [ ] `is_active = TRUE` di `users` table
- [ ] `email_confirmed_at` di `auth.users` **tidak NULL**

---

## 🔄 Alternative: Delete & Recreate

Jika masih error, delete dan buat ulang:

```sql
-- 1. Delete existing user
DELETE FROM users WHERE email = 'superadmin@decoq.com';
DELETE FROM auth.users WHERE email = 'superadmin@decoq.com';

-- 2. Create new user (from QUICK_CREATE_SUPERADMIN.md)
-- Run Step 2 & Step 3 dari panduan tersebut
```

---

## ✅ Summary

**Error "User tidak ditemukan dalam sistem" = User belum di-insert ke table `users`**

**Fix:**
1. Get auth_user_id dari Supabase Dashboard
2. INSERT INTO users dengan auth_user_id tersebut
3. Login lagi

**Done!** ✅

