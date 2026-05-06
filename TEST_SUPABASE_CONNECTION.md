# 🔌 Test Supabase Connection

## ✅ Environment Variables Fixed

File `.env.local` sudah diperbaiki:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zbblqmqgwzrhrcrofghr.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 Cara Test Connection

### **Step 1: Restart Development Server**

```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

### **Step 2: Test Login**

1. Buka: http://localhost:3000/auth/login
2. Masukkan email dan password Anda
3. Klik "Login"

**Jika berhasil:**
- ✅ Redirect ke `/dashboard`
- ✅ Muncul UI dashboard dengan sidebar
- ✅ Muncul statistics cards

**Jika gagal:**
- ❌ Error di console browser
- ❌ Tidak redirect
- ❌ Stuck di login page

---

## 🔍 Check Connection di Browser

### **Method 1: Browser Console**

1. Buka browser console (F12)
2. Paste code ini:

```javascript
// Test Supabase connection
const supabase = window.supabase || (() => {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    'https://zbblqmqgwzrhrcrofghr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmxxbXFnd3pyaHJjcm9mZ2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDkyNjIsImV4cCI6MjA5MzYyNTI2Mn0.mwsZbR0UCqm_19cRwAlTg9tqXQ0xD6d7WR3e1fgPcVM'
  )
})()

// Test query
supabase.from('users').select('count').then(console.log)
```

**Expected output:**
```javascript
{ data: [...], error: null }
```

---

### **Method 2: Network Tab**

1. Buka browser DevTools (F12)
2. Klik tab "Network"
3. Login di aplikasi
4. Cari request ke `zbblqmqgwzrhrcrofghr.supabase.co`

**Jika terhubung:**
- ✅ Status 200 OK
- ✅ Response berisi data

**Jika tidak terhubung:**
- ❌ Status 401/403/500
- ❌ CORS error
- ❌ Network error

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" atau CORS error

**Cause:** Supabase URL atau API key salah

**Solution:**
1. Buka Supabase Dashboard: https://app.supabase.com
2. Pilih project "DecoQ"
3. Klik **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
5. Update `.env.local`
6. Restart server

---

### Issue: "Invalid API key"

**Cause:** API key expired atau salah

**Solution:**
1. Generate new API key di Supabase Dashboard
2. Update `.env.local`
3. Restart server

---

### Issue: Tombol "Connect" masih muncul

**Cause:** Ini tombol untuk connect ke Supabase **dari Vercel/deployment platform**, bukan dari local development

**Solution:**
- Untuk local development: Tidak perlu klik tombol ini
- Untuk production: Klik "Connect" untuk link Vercel project ke Supabase

---

## ✅ Verification Checklist

Sebelum test, pastikan:

- [ ] File `.env.local` ada di root project
- [ ] `NEXT_PUBLIC_SUPABASE_URL` terisi dengan benar
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` terisi dengan benar
- [ ] `SUPABASE_SERVICE_ROLE_KEY` terisi dengan benar
- [ ] Development server sudah restart
- [ ] Database migration sudah dijalankan (table `users`, `auth_logs` ada)
- [ ] Superadmin sudah dibuat di database

---

## 🎯 Quick Test

**Cara tercepat test connection:**

```bash
# 1. Restart server
npm run dev

# 2. Buka browser
# http://localhost:3000/auth/login

# 3. Login dengan credentials Anda

# 4. Jika berhasil → Dashboard muncul ✅
# 5. Jika gagal → Check console error ❌
```

---

## 📝 Expected Behavior

### **Login Page**
- Form email + password
- Button "Login"
- No errors di console

### **After Login**
- Redirect ke `/dashboard`
- Sidebar muncul (kiri)
- Statistics cards muncul
- Role badge muncul (Admin/Superadmin)

### **Dashboard**
- Tab "Overview" active
- Stats loading → then show numbers
- No errors di console
- Logout button works

---

## 🚀 Summary

**Environment variables sudah fixed!**

**Next steps:**
1. ✅ Restart server: `npm run dev`
2. ✅ Test login: http://localhost:3000/auth/login
3. ✅ Check dashboard: http://localhost:3000/dashboard

**Jika masih error, share:**
- Screenshot error
- Console log
- Network tab

