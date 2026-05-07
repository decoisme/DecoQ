# 🐛 Debug "Gagal mengirim email invite" Error

## 📋 Error yang Muncul

```
⚠️ Gagal mengirim email invite
Failed to load resource: api/admin/invite:1 status 500
```

---

## 🔍 Cara Debug

### **Step 1: Deploy dengan Logging**

```bash
npm run build
vercel --prod
```

Saya sudah tambahkan logging lengkap di API.

---

### **Step 2: Coba Invite Admin Lagi**

1. Login ke dashboard
2. Manage Admin → Invite Admin
3. Isi form dan klik "Send Invite"
4. Error akan muncul

---

### **Step 3: Lihat Logs di Terminal**

**Jika di localhost:**
```bash
npm run dev
```

Lalu coba invite, lihat log di terminal:
```
📨 Invite request received: { email: 'test@example.com', role: 'admin' }
✅ Current user: adeirie@decoq.com
📧 Sending invite via Supabase Auth to: test@example.com
❌ Supabase invite error: { ... }
```

---

### **Step 4: Lihat Logs di Vercel (Production)**

```bash
vercel logs --follow
```

Atau di Vercel Dashboard:
1. Buka https://vercel.com/dashboard
2. Pilih project "DecoQ"
3. Klik tab "Logs"
4. Filter: "api/admin/invite"

---

## 🔍 Kemungkinan Error & Solusi

### **Error 1: "Email rate limit exceeded"**

**Log:**
```
❌ Supabase invite error: { message: "Email rate limit exceeded" }
```

**Penyebab:** Terlalu banyak invite dalam waktu singkat

**Solusi:**
- Tunggu 1 jam
- Atau upgrade Supabase plan

---

### **Error 2: "SMTP not configured"**

**Log:**
```
❌ Supabase invite error: { message: "SMTP not configured" }
```

**Penyebab:** Supabase email settings belum dikonfigurasi

**Solusi:**
1. Buka Supabase Dashboard
2. Authentication → Email Templates
3. Enable "Confirm signup" template
4. Configure SMTP (atau gunakan Supabase default)

---

### **Error 3: "User already exists"**

**Log:**
```
❌ Supabase invite error: { message: "User already registered" }
```

**Penyebab:** Email sudah terdaftar di Supabase Auth

**Solusi:**
1. Hapus user dari Supabase Auth:
   ```sql
   -- Di Supabase SQL Editor
   SELECT id, email FROM auth.users WHERE email = 'test@example.com';
   ```
2. Atau gunakan Supabase Dashboard → Authentication → Users → Delete

---

### **Error 4: "Invalid redirect URL"**

**Log:**
```
❌ Supabase invite error: { message: "Invalid redirect URL" }
```

**Penyebab:** `NEXT_PUBLIC_SITE_URL` tidak terdaftar di Supabase

**Solusi:**
1. Buka Supabase Dashboard
2. Authentication → URL Configuration
3. Tambahkan ke "Redirect URLs":
   ```
   https://decoq.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

---

### **Error 5: "Insert error: RLS policy"**

**Log:**
```
✅ Invite sent via Supabase Auth, auth_user_id: xxx
💾 Inserting user record to database...
❌ Insert error: { message: "new row violates row-level security policy" }
```

**Penyebab:** RLS policy block insert dari service role

**Solusi:**
```sql
-- Di Supabase SQL Editor
CREATE POLICY "Service role can insert users"
ON users FOR INSERT
TO service_role
USING (true);
```

---

### **Error 6: "Insert error: Foreign key constraint"**

**Log:**
```
❌ Insert error: { message: "violates foreign key constraint" }
```

**Penyebab:** `invited_by` user tidak ada

**Solusi:**
Sudah di-handle dengan `invited_by: inviter?.id || null`

Jika masih error, cek:
```sql
SELECT id, email FROM users WHERE auth_user_id = 'current-user-auth-id';
```

---

## 🧪 Test di Localhost

Untuk debug lebih mudah, test di localhost dulu:

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Watch logs
# (logs akan muncul di Terminal 1)
```

Lalu:
1. Buka http://localhost:3000/dashboard
2. Login
3. Manage Admin → Invite Admin
4. Lihat log di Terminal 1

---

## 📝 Checklist Debug

- [ ] Deploy dengan logging
- [ ] Coba invite admin
- [ ] Lihat logs (localhost atau Vercel)
- [ ] Identifikasi error message
- [ ] Apply solusi sesuai error
- [ ] Test ulang

---

## 💡 Tips

1. **Test di localhost dulu** - Lebih mudah debug
2. **Cek Supabase Dashboard** - Lihat Authentication → Users
3. **Cek email settings** - Pastikan SMTP configured
4. **Cek RLS policies** - Pastikan service role bisa insert
5. **Cek redirect URLs** - Pastikan URL terdaftar

---

## 🆘 Jika Masih Error

Kirim screenshot:
1. Error message di browser
2. Logs dari terminal/Vercel
3. Supabase Authentication settings

Saya akan bantu debug lebih lanjut!

---

**Next Step:** Deploy dan lihat logs untuk identifikasi error yang sebenarnya.

```bash
npm run build && vercel --prod
```

Lalu coba invite dan lihat logs!
