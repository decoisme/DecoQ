# ⚡ Quick Setup Guide - DecoQ Auth System

## 🎯 Step 4: Update Environment Variables (5 menit)

### 📍 **Lokasi File**

```
DecoQ/
├── .env.local          ← Edit file ini
├── .env.example        ← Template (jangan edit)
├── package.json
├── pages/
└── ...
```

---

### 🔑 **Get Keys dari Supabase (2 menit)**

#### **Visual Guide:**

```
1. Buka: https://app.supabase.com
   ↓
2. Login → Pilih project DecoQ
   ↓
3. Klik icon ⚙️ Settings (kiri bawah)
   ↓
4. Klik "API" di menu
   ↓
5. Copy 3 keys:
```

**Keys yang perlu di-copy:**

```
┌─────────────────────────────────────────────────┐
│ Project URL                                     │
│ https://xxxxxxxxxxxxx.supabase.co               │ ← Copy ini
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ anon public                                     │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...        │ ← Copy ini
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ service_role secret ⚠️                          │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...        │ ← Copy ini
└─────────────────────────────────────────────────┘
```

---

### 📝 **Edit .env.local (2 menit)**

#### **Option A: File Sudah Ada**

```bash
# Buka dengan text editor favorit
code .env.local
# atau
nano .env.local
# atau
notepad .env.local  # Windows
```

#### **Option B: File Belum Ada**

```bash
# Copy dari template
cp .env.example .env.local

# Edit
code .env.local
```

#### **Isi File:**

```env
# ============================================================
# SUPABASE CONFIGURATION
# ============================================================

# Project URL (dari Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anon/Public Key (dari Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...

# Service Role Key (dari Supabase Dashboard → Settings → API)
# ⚠️ RAHASIA - Jangan share atau commit ke git!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...

# ============================================================
# SITE CONFIGURATION
# ============================================================

# Site URL untuk redirect setelah login
# Development:
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production (uncomment dan ganti dengan domain Anda):
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# ============================================================
# OPTIONAL: Old Admin Keys (untuk backward compatibility)
# ============================================================

# Uncomment jika masih pakai sistem admin key lama
# ADMIN_KEY=admin123
# SUPERADMIN_KEY=superadmin123
```

**Save file** (Ctrl+S atau Cmd+S)

---

### ✅ **Verify Setup (1 menit)**

#### **Quick Check:**

```bash
# Check file exists
ls -la .env.local

# Should show:
# -rw-r--r-- 1 user user 1234 Jan 1 12:00 .env.local
```

#### **Content Check:**

Buka `.env.local` dan pastikan:
- ✅ Ada 4 baris dengan `=` (tidak kosong)
- ✅ URL dimulai dengan `https://`
- ✅ Keys panjang (~200 characters)
- ✅ Tidak ada extra spaces atau line breaks

#### **Visual Verification:**

```
✅ GOOD:
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...

❌ BAD:
NEXT_PUBLIC_SUPABASE_URL = https://abc123.supabase.co  ← Extra spaces
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc
...  ← Line break in middle of key
```

---

### 🔄 **Restart Dev Server**

**PENTING:** Environment variables hanya di-load saat server start!

```bash
# 1. Stop server yang sedang running
#    Tekan: Ctrl+C di terminal

# 2. Start lagi
npm run dev

# 3. Wait for "ready" message
# ✓ Ready on http://localhost:3000
```

---

### 🎉 **Done!**

Environment variables sudah setup. Lanjut ke:

**Step 5: Install Dependencies**
```bash
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
```

**Step 6: Test Login**
```
http://localhost:3000/auth/login
```

---

## 🐛 Common Issues

### ❌ "Cannot find module '@supabase/...'"

**Fix:**
```bash
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
```

### ❌ "Invalid API key"

**Fix:**
1. Re-copy keys dari Supabase Dashboard
2. Pastikan tidak ada extra spaces
3. Restart dev server

### ❌ "Environment variable undefined"

**Fix:**
```bash
# Restart server
# Ctrl+C
npm run dev
```

### ❌ ".env.local not found"

**Fix:**
```bash
# Check current directory
pwd

# Should be in project root (where package.json is)
# If not, cd to correct directory

cd /path/to/DecoQ
```

---

## 📋 Checklist

Before moving to Step 5:

- [ ] `.env.local` file exists in project root
- [ ] All 4 environment variables are set
- [ ] Keys copied correctly (no extra spaces)
- [ ] Dev server restarted
- [ ] No errors in terminal

---

## 🆘 Need Help?

**Check:**
1. File location: `.env.local` harus di root (sejajar dengan `package.json`)
2. File content: Pastikan format benar (lihat example di atas)
3. Server restart: Wajib restart setelah edit `.env.local`

**Still stuck?**
- Check `SETUP_STEP_BY_STEP.md` untuk detail lengkap
- Check `AUTH_SYSTEM_GUIDE.md` untuk troubleshooting

---

**Next: Step 5 - Install Dependencies** →
