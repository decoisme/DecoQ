# 🚀 Setup Superadmin TANPA Email (Bypass Email Limit)

## 🎯 Solusi untuk Supabase Email Limit

Jika Supabase Anda limit untuk send email, ada **3 cara alternatif** untuk setup superadmin pertama.

---

## ✅ **Option 1: Direct SQL Insert (Paling Mudah)**

### **Step 1: Enable Email Signup**

1. Buka Supabase Dashboard
2. **Authentication → Providers**
3. Pastikan **"Email"** provider enabled
4. **Disable "Confirm email"** (untuk bypass email verification)
   ```
   ☐ Enable email confirmations
   ```
5. Save

### **Step 2: Create User via SQL**

```sql
-- Buka Supabase SQL Editor
-- Run query ini (GANTI email dan password):

-- 1. Create auth user
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
  'superadmin@decoq.com',                    -- GANTI: Email Anda
  crypt('your-password-here', gen_salt('bf')), -- GANTI: Password Anda
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

-- 2. Copy ID yang muncul dari query di atas
-- Contoh output: a1b2c3d4-e5f6-7890-abcd-ef1234567890

-- 3. Insert ke users table (GANTI auth_user_id dengan ID dari step 2)
INSERT INTO users (
  email, 
  role, 
  full_name, 
  auth_user_id, 
  is_active
)
VALUES (
  'superadmin@decoq.com',           -- GANTI: Email yang sama dengan di atas
  'superadmin',
  'Super Admin',
  'paste-id-from-step-2-here',      -- GANTI: ID dari query pertama
  TRUE
);

-- 4. Verify
SELECT * FROM users WHERE email = 'superadmin@decoq.com';
```

### **Step 3: Login**

```
URL: http://localhost:3000/auth/login

Email: superadmin@decoq.com
Password: your-password-here (yang Anda set di SQL)

✅ Login berhasil!
```

---

## ✅ **Option 2: Signup Page (Lebih User-Friendly)**

### **Step 1: Create Signup Page**

Buat file `pages/auth/signup.tsx`:

```typescript
import Head from 'next/head'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, AlertTriangle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default function Signup() {
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Signup via Supabase Auth
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        setUserId(data.user.id)
        
        // 2. Insert to users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            email,
            role: 'superadmin',
            full_name: fullName,
            auth_user_id: data.user.id,
            is_active: true
          })

        if (insertError) {
          setError('User created but failed to add to database. Please contact admin.')
          console.error('Insert error:', insertError)
        } else {
          setSuccess(true)
          setTimeout(() => {
            router.push('/auth/login')
          }, 2000)
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Signup Superadmin — DecoQ</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background animation */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(255,249,133,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="glass"
          style={{
            padding: '2.5rem',
            width: '100%',
            maxWidth: 420,
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 0.75rem',
                background: 'linear-gradient(135deg, rgba(255,249,133,0.15), rgba(255,233,64,0.08))',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,249,133,0.2)'
              }}
            >
              <User size={32} color="#fff985" strokeWidth={2.5} />
            </motion.div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem' }}>
              Signup Superadmin
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: 6 }}>
              Buat akun superadmin pertama
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '2rem',
                textAlign: 'center'
              }}
            >
              <CheckCircle size={48} color="#4ade80" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ color: '#4ade80', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                Signup Berhasil!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Akun superadmin telah dibuat.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                Redirecting to login...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.82rem',
                  display: 'block',
                  marginBottom: 6
                }}>
                  Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.3)'
                    }} 
                  />
                  <input
                    type="email"
                    className="input-glass"
                    placeholder="superadmin@decoq.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.82rem',
                  display: 'block',
                  marginBottom: 6
                }}>
                  Nama Lengkap
                </label>
                <div style={{ position: 'relative' }}>
                  <User 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.3)'
                    }} 
                  />
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Super Admin"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.82rem',
                  display: 'block',
                  marginBottom: 6
                }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.3)'
                    }} 
                  />
                  <input
                    type="password"
                    className="input-glass"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Minimal 6 karakter
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    color: '#f87171',
                    fontSize: '0.83rem',
                    padding: '0.75rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertTriangle size={16} />
                  {error}
                </motion.div>
              )}

              {userId && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(255,249,133,0.1)',
                    border: '1px solid rgba(255,249,133,0.3)',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)'
                  }}
                >
                  <strong style={{ color: '#fff985' }}>User ID:</strong>
                  <br />
                  <code style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.7rem',
                    wordBreak: 'break-all'
                  }}>
                    {userId}
                  </code>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="spinner"
                    />
                    Creating account...
                  </>
                ) : (
                  <>
                    <User size={18} />
                    Create Superadmin
                  </>
                )}
              </motion.button>
            </form>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link
              href="/auth/login"
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.82rem',
                textDecoration: 'none'
              }}
            >
              Sudah punya akun? Login →
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  )
}
```

### **Step 2: Enable Email Signup**

1. Supabase Dashboard → **Authentication → Providers**
2. Enable **"Email"** provider
3. **Disable "Confirm email"**
4. Save

### **Step 3: Signup**

```
1. Go to: http://localhost:3000/auth/signup
2. Masukkan:
   - Email: superadmin@decoq.com
   - Nama: Super Admin
   - Password: your-password
3. Klik "Create Superadmin"
4. Auto-redirect ke login
5. Login dengan credentials yang baru dibuat
```

---

## ✅ **Option 3: Supabase Dashboard Manual Create**

### **Step 1: Create User via Dashboard**

1. Supabase Dashboard → **Authentication → Users**
2. Klik **"Add User"** (bukan "Invite User")
3. Masukkan:
   - Email: `superadmin@decoq.com`
   - Password: `your-password`
   - Auto Confirm User: **✓ Checked**
4. Klik **"Create User"**
5. Copy **User ID** yang muncul

### **Step 2: Insert ke Users Table**

```sql
-- Supabase SQL Editor
INSERT INTO users (email, role, full_name, auth_user_id, is_active)
VALUES (
  'superadmin@decoq.com',
  'superadmin',
  'Super Admin',
  'paste-user-id-here',  -- ID dari step 1
  TRUE
);

-- Verify
SELECT * FROM users WHERE email = 'superadmin@decoq.com';
```

### **Step 3: Login**

```
http://localhost:3000/auth/login

Email: superadmin@decoq.com
Password: your-password (dari step 1)
```

---

## 📋 **Comparison**

| Method | Pros | Cons | Difficulty |
|--------|------|------|------------|
| **Option 1: SQL** | No UI needed, fastest | Need to know SQL | Medium |
| **Option 2: Signup Page** | User-friendly, reusable | Need to create page | Easy |
| **Option 3: Dashboard** | No code needed | Manual steps | Easy |

---

## 🎯 **Recommended: Option 2 (Signup Page)**

Paling mudah dan bisa digunakan berulang kali.

**Steps:**
1. Copy code signup page di atas
2. Save ke `pages/auth/signup.tsx`
3. Enable email signup di Supabase
4. Go to http://localhost:3000/auth/signup
5. Create account
6. Done! ✅

---

## 🔒 **Security Note**

Setelah create superadmin pertama:

1. **Disable signup page** (atau protect dengan password)
2. **Enable email confirmation** kembali di Supabase
3. **Use invite system** untuk admin berikutnya

---

## 🐛 **Troubleshooting**

### **Issue: "User already registered"**

```sql
-- Delete existing user
DELETE FROM auth.users WHERE email = 'superadmin@decoq.com';
DELETE FROM users WHERE email = 'superadmin@decoq.com';

-- Try again
```

### **Issue: "Email not confirmed"**

```sql
-- Manually confirm email
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'superadmin@decoq.com';
```

### **Issue: Signup page error**

Check:
1. Email provider enabled di Supabase
2. "Confirm email" disabled
3. Environment variables correct

---

## ✅ **Summary**

**Untuk bypass email limit:**

1. ✅ **Option 1**: Direct SQL insert (fastest)
2. ✅ **Option 2**: Create signup page (recommended)
3. ✅ **Option 3**: Manual via Dashboard (easiest)

**Pilih salah satu yang paling cocok untuk Anda!**

---

**Setelah setup, Anda bisa login dan invite admin lain via UI!** 🚀
