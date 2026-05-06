# ⚡ Quick Fix: Email Redirect ke Homepage

## 🎯 Masalah
Klik link dari email invite → redirect ke **homepage** ❌

## ✅ Solusi (2 Menit)

### **Step 1: Konfigurasi Supabase**

1. Buka: https://app.supabase.com
2. Pilih project **DecoQ**
3. **Authentication** → **URL Configuration**
4. Tambahkan di **"Redirect URLs"**:
   ```
   http://localhost:3000/auth/callback
   ```
5. Set **"Site URL"**:
   ```
   http://localhost:3000
   ```
6. **Save**

---

### **Step 2: Restart Server**

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

### **Step 3: Test**

1. Invite user via UI: http://localhost:3000/manage-admin
2. Check email
3. Klik link di email
4. **Should redirect to dashboard** ✅

---

## 🔍 Expected Flow

```
Email link
  ↓
http://localhost:3000/auth/callback#access_token=...
  ↓
Loading spinner
  ↓
http://localhost:3000/dashboard
  ✅ Dashboard muncul!
```

---

## 🐛 Masih Error?

### Check 1: Redirect URL di Supabase
```
Authentication → URL Configuration
→ Harus ada: http://localhost:3000/auth/callback
```

### Check 2: Browser Console
```
F12 → Console
→ Check error messages
```

### Check 3: Link di Email
Link harus seperti ini:
```
http://localhost:3000/auth/callback#access_token=...
```

Bukan seperti ini:
```
https://xxx.supabase.co/auth/v1/verify?token=...
```

---

## 📖 Dokumentasi Lengkap

- [FIX_EMAIL_REDIRECT.md](FIX_EMAIL_REDIRECT.md) — Panduan lengkap troubleshooting
- [QUICK_CREATE_SUPERADMIN.md](QUICK_CREATE_SUPERADMIN.md) — Alternative: Create via SQL

---

## ✅ Done!

Setelah konfigurasi Supabase redirect URL, email invite akan berfungsi dengan benar! 🚀

