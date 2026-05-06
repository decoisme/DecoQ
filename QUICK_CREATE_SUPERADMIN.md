# ⚡ Quick Create Superadmin (TANPA EMAIL - 2 Menit)

## 🚨 Solusi untuk Supabase Email Limit

Karena Supabase Anda limit untuk send email, gunakan cara ini untuk **langsung create superadmin via SQL**.

---

## ✅ Step 1: Disable Email Confirmation

1. Buka **Supabase Dashboard**: https://app.supabase.com
2. Pilih project Anda
3. Klik **Authentication** → **Providers**
4. Scroll ke **Email** provider
5. **UNCHECK** "Enable email confirmations"
   ```
   ☐ Enable email confirmations
   ```
6. Klik **Save**

---

## ✅ Step 2: Run SQL Query

1. Buka **SQL Editor** di Supabase Dashboard
2. **Copy-paste query ini** (GANTI email dan password):

```sql
-- ============================================================
-- CREATE SUPERADMIN TANPA EMAIL
-- Ganti email dan password sesuai keinginan Anda
-- ============================================================

-- 1. Create auth user dengan password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'superadmin@decoq.com',                    -- ⚠️ GANTI: Email Anda
  crypt('admin123', gen_salt('bf')),         -- ⚠️ GANTI: Password Anda
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
RETURNING id;

-- ⚠️ COPY ID yang muncul dari query di atas!
-- Contoh output: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

3. **Klik "Run"**
4. **COPY ID** yang muncul di hasil query (contoh: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

---

## ✅ Step 3: Insert ke Users Table

1. Masih di **SQL Editor**
2. **Copy-paste query ini** (GANTI `auth_user_id` dengan ID dari Step 2):

```sql
-- 2. Insert ke users table
INSERT INTO users (
  email, 
  role, 
  full_name, 
  auth_user_id, 
  is_active
)
VALUES (
  'superadmin@decoq.com',           -- ⚠️ GANTI: Email yang SAMA dengan Step 2
  'superadmin',
  'Super Admin',
  'paste-id-from-step-2-here',      -- ⚠️ GANTI: ID dari Step 2
  TRUE
);

-- Verify
SELECT * FROM users WHERE email = 'superadmin@decoq.com';
```

3. **Klik "Run"**
4. **Check hasil** - harus muncul 1 row dengan email Anda

---

## ✅ Step 4: Login

1. **Buka aplikasi**: http://localhost:3000/auth/login

2. **Login dengan:**
   - **Email**: `superadmin@decoq.com` (yang Anda set di SQL)
   - **Password**: `admin123` (yang Anda set di SQL)

3. **Klik "Login"**

4. **✅ Berhasil!** Redirect ke dashboard

---

## 📋 Credentials Template

Simpan credentials Anda:

```
Email: superadmin@decoq.com
Password: admin123
Role: superadmin
Login URL: http://localhost:3000/auth/login
```

---

## 🎯 Quick Summary

```
1. Supabase Dashboard → Authentication → Providers
   → Disable "Enable email confirmations"
   ↓
2. SQL Editor → Run query CREATE auth.users
   → Copy ID yang muncul
   ↓
3. SQL Editor → Run query INSERT INTO users
   → Paste ID dari step 2
   ↓
4. Login di http://localhost:3000/auth/login
   ✅ DONE!
```

---

## 🐛 Troubleshooting

### **Issue: "duplicate key value violates unique constraint"**

**Cause:** Email sudah terdaftar

**Solution:**
```sql
-- Delete existing user
DELETE FROM auth.users WHERE email = 'superadmin@decoq.com';
DELETE FROM users WHERE email = 'superadmin@decoq.com';

-- Try again from Step 2
```

---

### **Issue: "Invalid login credentials"**

**Cause:** Password salah atau email confirmation belum disabled

**Solution:**
1. Check email confirmation disabled (Step 1)
2. Reset password:
   ```sql
   -- Update password
   UPDATE auth.users 
   SET encrypted_password = crypt('new-password', gen_salt('bf')),
       email_confirmed_at = NOW()
   WHERE email = 'superadmin@decoq.com';
   ```

---

### **Issue: "User tidak ditemukan dalam sistem"**

**Cause:** Belum insert ke `users` table

**Solution:**
```sql
-- Check if user exists in users table
SELECT * FROM users WHERE email = 'superadmin@decoq.com';

-- If empty, run Step 3 again
```

---

### **Issue: "column role does not exist"**

**Cause:** Database migration belum dijalankan

**Solution:**
```sql
-- Run migration
-- Copy-paste isi file: supabase-auth-migration-safe.sql
```

---

## 🔒 Security Note

Setelah create superadmin pertama:

1. ✅ **Enable email confirmation** kembali di Supabase
2. ✅ **Ganti password** via UI (Settings)
3. ✅ **Use invite system** untuk admin berikutnya

---

## 📝 Next Steps

Setelah berhasil login:

1. ✅ **Access Manage Admin**: http://localhost:3000/manage-admin
2. ✅ **Invite Admin Lain**: Klik "Invite Admin" button
3. ✅ **Ganti Password**: Settings → Change Password
4. ✅ **Enable Email Confirmation**: Supabase → Authentication → Providers

---

## 🎉 Done!

**Sekarang Anda bisa login tanpa email!** 🚀

**Credentials:**
- Email: superadmin@decoq.com
- Password: admin123
- URL: http://localhost:3000/auth/login

**Setelah login, invite admin lain via UI!**

