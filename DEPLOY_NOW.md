# 🚀 Deploy Fitur Manage Admin - Step by Step

## ❗ Kenapa Fitur Belum Terlihat?

Fitur sudah ada di **code lokal** tapi belum di-**deploy ke production**.

**Production:** https://decoq.vercel.app (belum ada fitur baru)  
**Localhost:** http://localhost:3003 (sudah ada fitur baru)

---

## ✅ Solusi: Deploy ke Production

### **Step 1: Build**

```bash
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (11/11)
```

---

### **Step 2: Deploy**

```bash
vercel --prod
```

**Expected Output:**
```
🔍  Inspect: https://vercel.com/...
✅  Production: https://decoq.vercel.app
```

---

### **Step 3: Test**

1. Buka https://decoq.vercel.app/dashboard
2. Login sebagai superadmin
3. Klik "Manage Admin" di sidebar
4. Lihat tabel dengan kolom baru:
   - Status (Pending/Active/Inactive)
   - Last Active (tanggal & waktu)

---

## 🧪 Cara Test Fitur

### **Test 1: Lihat Daftar Admin**

1. Dashboard → Manage Admin
2. Lihat tabel admin
3. Cek kolom "Status" dan "Last Active"

**Expected:**
- ✅ Kolom "Status" muncul
- ✅ Kolom "Last Active" muncul
- ✅ User yang sudah login tampil dengan tanggal

---

### **Test 2: Invite Admin Baru**

1. Klik "Invite Admin"
2. Isi form (email, nama, role)
3. Send Invite
4. Refresh page

**Expected:**
- ✅ User baru muncul di tabel
- ✅ Status: "⏳ Pending" (kuning)
- ✅ Last Active: "Belum pernah login"

---

### **Test 3: Admin Aktivasi**

1. Buka email invite
2. Klik link
3. Setup password
4. Aktifkan Akun
5. Kembali ke Manage Admin

**Expected:**
- ✅ Status berubah: "● Active" (hijau)
- ✅ Last Active: Tanggal & waktu sekarang

---

## 🐛 Troubleshooting

### **Fitur masih belum muncul setelah deploy?**

**Cek 1: Hard refresh browser**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

**Cek 2: Clear cache**
- Buka DevTools (F12)
- Application → Clear storage → Clear site data

**Cek 3: Vercel deployment**
```bash
vercel logs --follow
```

Lihat apakah ada error saat deploy.

---

### **Kolom "Status" atau "Last Active" tidak muncul?**

**Kemungkinan:** Database belum punya kolom tersebut.

**Solusi:** Run SQL migration di Supabase:

```sql
-- Add status column (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('pending', 'active', 'inactive'));

-- Add last_login_at column (if not exists)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Update existing users
UPDATE users 
SET status = 'active' 
WHERE is_active = true AND status IS NULL;

UPDATE users 
SET status = 'inactive' 
WHERE is_active = false AND status IS NULL;
```

---

### **Data tidak muncul di tabel?**

**Cek 1: Apakah ada user?**
```sql
SELECT * FROM users ORDER BY created_at DESC;
```

**Cek 2: Apakah API error?**
- Buka DevTools (F12)
- Network tab
- Lihat request `/api/admin/list-users`
- Cek response

---

## 📊 Expected Result

Setelah deploy, Manage Admin akan tampil seperti ini:

```
┌──────────────────────┬──────────┬───────────┬─────────┬──────────────┬────────────┬─────────┐
│ Email                │ Nama     │ Role      │ Status  │ Last Active  │ Created    │ Actions │
├──────────────────────┼──────────┼───────────┼─────────┼──────────────┼────────────┼─────────┤
│ adeirie@decoq.com    │ -        │ Superadmin│ ● Active│ 07 Mei 2026  │ 01 Mei 2026│ ↓ ✕    │
│                      │          │           │         │ 14:30        │            │         │
├──────────────────────┼──────────┼───────────┼─────────┼──────────────┼────────────┼─────────┤
│ test@example.com     │ Test User│ Admin     │⏳Pending│ Belum pernah │ 07 Mei 2026│ ↑ ✕    │
│                      │          │           │         │ login        │            │         │
└──────────────────────┴──────────┴───────────┴─────────┴──────────────┴────────────┴─────────┘
```

---

## ⚡ Quick Deploy

```bash
# One command to build and deploy
npm run build && vercel --prod
```

Tunggu sampai selesai, lalu buka https://decoq.vercel.app/dashboard

---

## ✅ Checklist

- [ ] Build lokal (`npm run build`)
- [ ] Deploy ke Vercel (`vercel --prod`)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Login ke dashboard
- [ ] Buka Manage Admin
- [ ] Lihat kolom "Status" dan "Last Active"
- [ ] Test invite admin baru
- [ ] Cek status "Pending"

---

**Status:** 🚀 **READY TO DEPLOY**

Deploy sekarang dan fitur akan langsung terlihat!
