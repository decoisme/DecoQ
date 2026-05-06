# 🔐 First Login Guide - Setup Superadmin Pertama

## ❓ "Login passwordnya mana?"

Untuk login pertama kali, Anda perlu **membuat superadmin account** terlebih dahulu via Supabase Dashboard.

---

## 🚀 Setup Superadmin Pertama (5 menit)

### **Step 1: Buka Supabase Dashboard**

1. Go to: https://app.supabase.com
2. Login dengan akun Anda
3. Pilih project DecoQ

---

### **Step 2: Invite User via Supabase Auth**

#### **Option A: Via Dashboard (Recommended)**

1. **Klik "Authentication"** di sidebar kiri
2. **Klik "Users"** tab
3. **Klik "Invite User"** button (atau "Add User")

   ```
   ┌─────────────────────────────────────┐
   │ Invite User                         │
   ├─────────────────────────────────────┤
   │ Email:                              │
   │ [superadmin@decoq.com        ]      │ ← Masukkan email Anda
   │                                     │
   │ [Send Invite]  [Cancel]             │
   └─────────────────────────────────────┘
   ```

4. Masukkan email Anda (contoh: `superadmin@decoq.com`)
5. Klik **"Send Invite"** atau **"Invite"**

#### **Option B: Via SQL (Alternative)**

Jika tidak ada tombol "Invite User", gunakan SQL:

```sql
-- Di Supabase SQL Editor, run:
SELECT auth.invite_user_by_email('superadmin@decoq.com');
```

---

### **Step 3: Check Email & Set Password**

1. **Buka email Anda** (yang digunakan untuk invite)
2. **Cari email dari Supabase** dengan subject seperti:
   - "Confirm your signup"
   - "You have been invited"
   - "Complete your signup"

3. **Klik link di email** (contoh: `https://xxx.supabase.co/auth/v1/verify?token=...`)

4. **Set password Anda**:
   ```
   ┌─────────────────────────────────────┐
   │ Set Your Password                   │
   ├─────────────────────────────────────┤
   │ New Password:                       │
   │ [••••••••••••]                      │
   │                                     │
   │ Confirm Password:                   │
   │ [••••••••••••]                      │
   │                                     │
   │ [Set Password]                      │
   └─────────────────────────────────────┘
   ```

5. Klik **"Set Password"** atau **"Update Password"**

---

### **Step 4: Get Auth User ID**

Setelah set password, kembali ke Supabase Dashboard:

1. **Klik "Authentication" → "Users"**
2. **Cari user yang baru dibuat** (email Anda)
3. **Klik pada user** untuk melihat detail
4. **Copy "ID"** (UUID format, contoh: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

   ```
   User Details
   ├─ ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890  ← Copy ini
   ├─ Email: superadmin@decoq.com
   ├─ Created: 2024-01-01 12:00:00
   └─ ...
   ```

---

### **Step 5: Insert ke Users Table**

1. **Buka SQL Editor** di Supabase
2. **Run query ini** (ganti `AUTH_USER_ID` dan `EMAIL`):

```sql
-- Insert superadmin ke users table
INSERT INTO users (
  email, 
  role, 
  full_name, 
  auth_user_id, 
  is_active
)
VALUES (
  'superadmin@decoq.com',           -- Ganti dengan email Anda
  'superadmin',                      -- Role: superadmin
  'Super Admin',                     -- Nama lengkap (optional)
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- Ganti dengan ID dari Step 4
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
id                                   | email                  | role       | is_active
-------------------------------------|------------------------|------------|----------
uuid-here                            | superadmin@decoq.com   | superadmin | true
```

---

### **Step 6: Test Login**

Sekarang Anda bisa login!

1. **Buka aplikasi**: http://localhost:3000/auth/login

2. **Login dengan:**
   - **Email**: `superadmin@decoq.com` (yang Anda gunakan di Step 2)
   - **Password**: Password yang Anda set di Step 3

3. **Klik "Login"**

4. **Redirect ke Dashboard** ✅

---

## 🎯 Quick Summary

```
1. Supabase Dashboard → Authentication → Users → Invite User
   ↓
2. Masukkan email → Send Invite
   ↓
3. Check email → Klik link → Set password
   ↓
4. Copy Auth User ID dari Supabase Dashboard
   ↓
5. Run SQL: INSERT INTO users (email, role, auth_user_id, ...)
   ↓
6. Login di http://localhost:3000/auth/login
   ✅ DONE!
```

---

## 📋 Credentials Template

Setelah setup, simpan credentials Anda:

```
Email: superadmin@decoq.com
Password: [password yang Anda set di Step 3]
Role: superadmin
```

---

## 🐛 Troubleshooting

### **Issue: Email invite tidak masuk**

**Solution:**
1. Check spam folder
2. Check email di Supabase Dashboard → Authentication → Users (pastikan status "Invited")
3. Resend invite:
   ```sql
   -- Resend invite
   SELECT auth.invite_user_by_email('superadmin@decoq.com');
   ```

### **Issue: Link di email expired**

**Solution:**
```sql
-- Generate new invite
DELETE FROM auth.users WHERE email = 'superadmin@decoq.com';
SELECT auth.invite_user_by_email('superadmin@decoq.com');
```

### **Issue: "User tidak ditemukan dalam sistem" saat login**

**Cause:** Belum insert ke `users` table (Step 5)

**Solution:**
```sql
-- Check if user exists in users table
SELECT * FROM users WHERE email = 'superadmin@decoq.com';

-- If empty, run INSERT query from Step 5
```

### **Issue: "Invalid login credentials"**

**Cause:** Password salah atau user belum set password

**Solution:**
1. Reset password via Supabase Dashboard:
   - Authentication → Users → Click user → Reset Password
2. Check email → Set new password
3. Try login again

### **Issue: "Akun Anda tidak aktif"**

**Solution:**
```sql
-- Activate user
UPDATE users 
SET is_active = TRUE 
WHERE email = 'superadmin@decoq.com';
```

---

## 🔄 Alternative: Manual Signup (Jika Invite Tidak Berfungsi)

### **Step 1: Enable Email Signup di Supabase**

1. Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. Disable "Confirm email" (untuk testing)

### **Step 2: Create Signup Page (Temporary)**

Buat file `pages/auth/signup.tsx`:

```typescript
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) {
      alert(error.message)
    } else {
      alert('Signup success! Check email for confirmation.')
      console.log('User ID:', data.user?.id)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Signup Superadmin</h1>
      <input 
        type="email" 
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input 
        type="password" 
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignup}>Signup</button>
    </div>
  )
}
```

### **Step 3: Signup**

1. Go to: http://localhost:3000/auth/signup
2. Masukkan email & password
3. Klik "Signup"
4. Copy User ID dari console
5. Run SQL INSERT (Step 5 dari guide utama)

---

## 📝 Next Steps Setelah Login Berhasil

Setelah berhasil login sebagai superadmin:

1. ✅ **Access Manage Admin**: http://localhost:3000/manage-admin
2. ✅ **Invite Admin Lain**: Klik "Invite Admin" button
3. ✅ **Manage Users**: View, edit, delete users
4. ✅ **Check Logs**: View audit logs

---

## 🎉 Summary

**Untuk login pertama kali:**

1. **Setup superadmin** via Supabase Dashboard (invite user)
2. **Set password** via email link
3. **Insert ke users table** via SQL
4. **Login** di http://localhost:3000/auth/login

**Credentials:**
- Email: Yang Anda gunakan untuk invite
- Password: Yang Anda set via email link

---

**Setelah setup, Anda bisa invite admin lain via UI!** 🚀
