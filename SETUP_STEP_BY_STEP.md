# 🚀 Setup Step by Step - DecoQ Auth System

## Step 4: Update Environment Variables

### 📋 **Yang Dibutuhkan**

Anda perlu mendapatkan 3 keys dari Supabase Dashboard:
1. **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
2. **Anon/Public Key** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
3. **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`)

---

### 🔑 **Cara Mendapatkan Keys dari Supabase**

#### **1. Buka Supabase Dashboard**
- Go to: https://app.supabase.com
- Login dengan akun Anda
- Pilih project DecoQ Anda

#### **2. Buka Settings → API**
- Klik icon **Settings** (⚙️) di sidebar kiri bawah
- Klik **API** di menu settings

#### **3. Copy Keys**

Anda akan melihat section **Project API keys**:

```
Project URL
https://xxxxxxxxxxxxx.supabase.co
```
👆 Copy ini untuk `NEXT_PUBLIC_SUPABASE_URL`

```
anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
👆 Copy ini untuk `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

```
service_role secret
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
👆 Copy ini untuk `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **PENTING**: `service_role` key adalah **SECRET** - jangan share atau commit ke git!

---

### 📝 **Update .env.local**

#### **Cara 1: Edit File yang Sudah Ada**

1. Buka file `.env.local` di root project DecoQ
2. Update atau tambahkan keys berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Site URL (untuk redirect setelah login)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Keep old admin keys for backward compatibility
# ADMIN_KEY=admin123
# SUPERADMIN_KEY=superadmin123
```

3. Save file

#### **Cara 2: Copy dari .env.example**

Jika belum punya `.env.local`:

```bash
# Di terminal, di root project
cp .env.example .env.local

# Edit .env.local dengan text editor
nano .env.local
# atau
code .env.local
```

---

### ✅ **Verify Environment Variables**

#### **1. Check File Exists**

```bash
# Di terminal
ls -la .env.local

# Jika file ada, akan muncul:
# -rw-r--r-- 1 user user 500 Jan 1 12:00 .env.local
```

#### **2. Check Content**

```bash
# Print isi file (hati-hati, jangan share output ini!)
cat .env.local

# Atau buka dengan editor
code .env.local
```

Pastikan ada 4 variables:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXT_PUBLIC_SITE_URL`

#### **3. Test di Code**

Buat file test `test-env.js` di root project:

```javascript
// test-env.js
console.log('Testing environment variables...\n')

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set')
console.log('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set')
console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL ? '✅ Set' : '❌ Not set')

console.log('\nIf all show ✅, you are good to go!')
```

Run test:
```bash
node -r dotenv/config test-env.js

# Expected output:
# Testing environment variables...
# 
# NEXT_PUBLIC_SUPABASE_URL: ✅ Set
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ✅ Set
# SUPABASE_SERVICE_ROLE_KEY: ✅ Set
# NEXT_PUBLIC_SITE_URL: ✅ Set
# 
# If all show ✅, you are good to go!
```

---

### 🔒 **Security Best Practices**

#### **1. Jangan Commit .env.local ke Git**

Check `.gitignore` sudah include:

```bash
# Check gitignore
cat .gitignore | grep env

# Should show:
# .env*.local
# .env.local
```

Jika belum ada, tambahkan:

```bash
echo ".env.local" >> .gitignore
```

#### **2. Jangan Share Keys**

❌ **JANGAN:**
- Share di chat/email
- Commit ke GitHub
- Screenshot dengan keys visible
- Paste di public forum

✅ **BOLEH:**
- Simpan di password manager
- Share via secure channel (encrypted)
- Use environment variables di production

#### **3. Rotate Keys Regularly**

Untuk production, rotate keys setiap 90 hari:
1. Generate new keys di Supabase Dashboard
2. Update `.env.local` (dev) dan Vercel env vars (prod)
3. Revoke old keys

---

### 🚀 **Restart Development Server**

Setelah update `.env.local`, **WAJIB restart** dev server:

```bash
# Stop server (Ctrl+C di terminal yang running npm run dev)

# Start lagi
npm run dev

# Server akan load environment variables yang baru
```

---

### 🐛 **Troubleshooting**

#### **Issue: Environment variables undefined**

**Cause:** Server belum di-restart setelah update `.env.local`

**Solution:**
```bash
# Stop server (Ctrl+C)
# Start lagi
npm run dev
```

#### **Issue: "Invalid API key" error**

**Cause:** Keys salah atau expired

**Solution:**
1. Re-copy keys dari Supabase Dashboard
2. Pastikan tidak ada extra spaces
3. Pastikan copy full key (biasanya panjang ~200 characters)

#### **Issue: CORS error**

**Cause:** `NEXT_PUBLIC_SITE_URL` tidak match dengan actual URL

**Solution:**
```env
# Development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production (ganti dengan domain Anda)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

#### **Issue: .env.local tidak terbaca**

**Cause:** File di folder yang salah

**Solution:**
```bash
# .env.local HARUS di root project, sejajar dengan package.json
# Check struktur:
ls -la

# Should see:
# .env.local
# package.json
# pages/
# components/
# etc.
```

---

### 📋 **Checklist**

Sebelum lanjut ke Step 5, pastikan:

- [ ] File `.env.local` exists di root project
- [ ] `NEXT_PUBLIC_SUPABASE_URL` sudah diisi dengan Project URL
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sudah diisi dengan anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` sudah diisi dengan service_role key
- [ ] `NEXT_PUBLIC_SITE_URL` sudah diisi (http://localhost:3000 untuk dev)
- [ ] `.env.local` sudah ada di `.gitignore`
- [ ] Development server sudah di-restart
- [ ] Test environment variables (semua ✅)

---

### ➡️ **Next: Step 5 - Install Dependencies**

Setelah environment variables setup, lanjut install packages:

```bash
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
```

Lihat detail di `AUTH_SYSTEM_GUIDE.md` atau tanya "step 5 bagaimana caranya"

---

## 📚 **Reference**

### **Environment Variables Explained**

| Variable | Type | Purpose | Example |
|----------|------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Client-side auth | `eyJhbGc...` (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Server-side admin operations | `eyJhbGc...` (service_role) |
| `NEXT_PUBLIC_SITE_URL` | Public | Redirect URL after auth | `http://localhost:3000` |

**Note:** Variables dengan prefix `NEXT_PUBLIC_` akan di-expose ke browser (client-side). Variables tanpa prefix hanya available di server-side.

---

**Environment variables sudah setup! Lanjut ke Step 5.** 🎉
