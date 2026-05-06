# 🐛 Debug: "User tidak ditemukan dalam sistem"

## ❓ Apa Artinya Error Ini?

Error ini muncul **setelah login berhasil**, artinya:
- ✅ Email + password **benar** (Supabase Auth berhasil)
- ❌ User **tidak ada** di table `users` ATAU `auth_user_id` tidak match

---

## 🔍 Step-by-Step Debug

### **Step 1: Cek User di auth.users**

Buka **Supabase SQL Editor** dan run:

```sql
-- Cek user di auth.users (Supabase Auth)
SELECT 
  id as auth_user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'superadmin@decoq.com';  -- GANTI dengan email Anda
```

**Expected output:**
```
auth_user_id                          | email                  | email_confirmed_at      | created_at
--------------------------------------|------------------------|-------------------------|------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | superadmin@decoq.com   | 2024-01-01 12:00:00     | 2024-01-01
```

**✅ Jika ada output:** User exists di Supabase Auth → Lanjut Step 2  
**❌ Jika kosong:** User tidak ada → Buat user baru (lihat bagian "Solusi")

---

### **Step 2: Cek User di users table**

```sql
-- Cek user di users table (aplikasi)
SELECT 
  id,
  email,
  role,
  auth_user_id,
  is_active,
  created_at
FROM users
WHERE email = 'superadmin@decoq.com';  -- GANTI dengan email Anda
```

**Expected output:**
```
id       | email                  | role       | auth_user_id                         | is_active | created_at
---------|------------------------|------------|--------------------------------------|-----------|------------
uuid...  | superadmin@decoq.com   | superadmin | a1b2c3d4-e5f6-7890-abcd-ef1234567890 | true      | 2024-01-01
```

**✅ Jika ada output:** User exists → Lanjut Step 3  
**❌ Jika kosong:** User tidak ada di table `users` → **INI MASALAHNYA!**

---

### **Step 3: Cek Apakah auth_user_id Match**

```sql
-- Cek apakah auth_user_id di users table sama dengan id di auth.users
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  u.auth_user_id as users_auth_id,
  u.email as users_email,
  CASE 
    WHEN au.id = u.auth_user_id THEN '✅ MATCH'
    ELSE '❌ NOT MATCH'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.email = u.email
WHERE au.email = 'superadmin@decoq.com';  -- GANTI dengan email Anda
```

**Expected output:**
```
auth_id      | auth_email           | users_auth_id | users_email          | status
-------------|----------------------|---------------|----------------------|----------
a1b2c3d4...  | superadmin@decoq.com | a1b2c3d4...   | superadmin@decoq.com | ✅ MATCH
```

**✅ Jika MATCH:** auth_user_id benar → Lanjut Step 4  
**❌ Jika NOT MATCH atau NULL:** auth_user_id salah → **INI MASALAHNYA!**

---

### **Step 4: Cek is_active**

```sql
-- Cek apakah user active
SELECT 
  email,
  role,
  is_active,
  CASE 
    WHEN is_active = TRUE THEN '✅ ACTIVE'
    ELSE '❌ INACTIVE'
  END as status
FROM users
WHERE email = 'superadmin@decoq.com';  -- GANTI dengan email Anda
```

**Expected output:**
```
email                  | role       | is_active | status
-----------------------|------------|-----------|----------
superadmin@decoq.com   | superadmin | true      | ✅ ACTIVE
```

**✅ Jika ACTIVE:** User active → Seharusnya bisa login  
**❌ Jika INACTIVE:** User inactive → Activate user (lihat bagian "Solusi")

---

## ✅ Solusi Berdasarkan Hasil Debug

### **Solusi 1: User Tidak Ada di users table**

**Jika Step 2 kosong:**

```sql
-- Get auth_user_id dari Step 1
-- Lalu insert ke users table:

INSERT INTO users (
  email, 
  role, 
  full_name, 
  auth_user_id, 
  is_active
)
VALUES (
  'superadmin@decoq.com',           -- GANTI: Email Anda
  'superadmin',
  'Super Admin',
  'paste-auth-user-id-from-step-1', -- GANTI: ID dari Step 1
  TRUE
)
ON CONFLICT (email) 
DO UPDATE SET 
  auth_user_id = EXCLUDED.auth_user_id,
  is_active = TRUE;

-- Verify
SELECT * FROM users WHERE email = 'superadmin@decoq.com';
```

---

### **Solusi 2: auth_user_id Tidak Match**

**Jika Step 3 NOT MATCH:**

```sql
-- Update auth_user_id di users table
UPDATE users 
SET auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'superadmin@decoq.com'
)
WHERE email = 'superadmin@decoq.com';

-- Verify
SELECT 
  u.email,
  u.auth_user_id,
  au.id as auth_id,
  CASE WHEN u.auth_user_id = au.id THEN '✅ MATCH' ELSE '❌ NOT MATCH' END as status
FROM users u
JOIN auth.users au ON u.email = au.email
WHERE u.email = 'superadmin@decoq.com';
```

---

### **Solusi 3: User Inactive**

**Jika Step 4 INACTIVE:**

```sql
-- Activate user
UPDATE users 
SET is_active = TRUE 
WHERE email = 'superadmin@decoq.com';

-- Verify
SELECT email, is_active FROM users WHERE email = 'superadmin@decoq.com';
```

---

### **Solusi 4: User Tidak Ada di auth.users**

**Jika Step 1 kosong (user tidak ada di Supabase Auth):**

```sql
-- Create user di auth.users
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'superadmin@decoq.com',              -- GANTI: Email Anda
  crypt('admin123', gen_salt('bf')),   -- GANTI: Password Anda
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}',
  NOW(), NOW(), '', '', '', ''
)
RETURNING id;

-- Copy ID yang muncul, lalu run Solusi 1
```

---

## 🎯 Quick Fix (All-in-One)

Jika bingung, run query ini untuk **fix semua sekaligus**:

```sql
-- 1. Cek status current
SELECT 
  'auth.users' as table_name,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM auth.users 
WHERE email = 'superadmin@decoq.com'
UNION ALL
SELECT 
  'users' as table_name,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM users 
WHERE email = 'superadmin@decoq.com';

-- 2. Jika users table kosong, insert:
INSERT INTO users (email, role, full_name, auth_user_id, is_active)
SELECT 
  au.email,
  'superadmin',
  'Super Admin',
  au.id,
  TRUE
FROM auth.users au
WHERE au.email = 'superadmin@decoq.com'
ON CONFLICT (email) 
DO UPDATE SET 
  auth_user_id = EXCLUDED.auth_user_id,
  is_active = TRUE;

-- 3. Verify
SELECT 
  u.email,
  u.role,
  u.is_active,
  u.auth_user_id,
  au.id as auth_id,
  CASE WHEN u.auth_user_id = au.id THEN '✅ OK' ELSE '❌ ERROR' END as status
FROM users u
JOIN auth.users au ON u.email = au.email
WHERE u.email = 'superadmin@decoq.com';
```

**Expected output:**
```
email                  | role       | is_active | auth_user_id | auth_id      | status
-----------------------|------------|-----------|--------------|--------------|--------
superadmin@decoq.com   | superadmin | true      | a1b2c3d4...  | a1b2c3d4...  | ✅ OK
```

---

## 🧪 Test Login Setelah Fix

1. **Buka:** http://localhost:3000/auth/login
2. **Login dengan:**
   - Email: `superadmin@decoq.com`
   - Password: `admin123` (atau password Anda)
3. **Klik "Login"**
4. **✅ Seharusnya berhasil!**

---

## 📝 Checklist Verification

Sebelum login, pastikan semua ini ✅:

```sql
-- Run query ini untuk verify semua
SELECT 
  '1. User exists in auth.users' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM auth.users WHERE email = 'superadmin@decoq.com'
UNION ALL
SELECT 
  '2. User exists in users table',
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM users WHERE email = 'superadmin@decoq.com'
UNION ALL
SELECT 
  '3. auth_user_id matches',
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM users u
JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'superadmin@decoq.com'
UNION ALL
SELECT 
  '4. User is active',
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM users WHERE email = 'superadmin@decoq.com' AND is_active = TRUE;
```

**Expected output:**
```
check_item                        | status
----------------------------------|--------
1. User exists in auth.users      | ✅ PASS
2. User exists in users table     | ✅ PASS
3. auth_user_id matches           | ✅ PASS
4. User is active                 | ✅ PASS
```

**Jika semua ✅ PASS → Login akan berhasil!**

---

## 🚀 Summary

**Error "User tidak ditemukan" = User tidak ada di table `users` atau `auth_user_id` tidak match**

**Quick Fix:**
1. Run query "Quick Fix (All-in-One)" di atas
2. Verify dengan checklist
3. Login lagi

**Seharusnya berhasil!** ✅

