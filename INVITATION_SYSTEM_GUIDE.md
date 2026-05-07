# 🎉 Sistem Undangan Admin - Panduan Lengkap

## 📋 Ringkasan

Sistem undangan admin telah diperbarui dengan fitur **status pending** dan **aktivasi akun via email**. Admin yang baru diundang akan menerima email dengan link konfirmasi untuk mengatur password mereka.

---

## 🔄 Alur Kerja (Workflow)

### 1️⃣ **Superadmin Mengundang Admin Baru**

**Lokasi:** Dashboard → Manage Admin → Invite Admin

**Proses:**
1. Superadmin mengisi form:
   - Email admin baru
   - Nama lengkap (opsional)
   - Role (Admin atau Superadmin)
2. Klik "Send Invite"
3. Sistem akan:
   - Membuat user record dengan `status: 'pending'`
   - Generate secure token (32 bytes hex)
   - Menyimpan token di database dengan expiry 7 hari
   - Mengirim email undangan via **Nodemailer** (atau fallback ke Supabase Auth)

**Status di Database:**
```sql
status: 'pending'
is_active: false
invitation_token: 'abc123...'
invitation_expires_at: '2026-05-14T...'
```

---

### 2️⃣ **Admin Baru Menerima Email**

**Email berisi:**
- Nama pengirim undangan
- Role yang diberikan (Admin/Superadmin)
- Tombol "Accept Invitation"
- Link konfirmasi: `https://decoq.vercel.app/auth/confirm?token=abc123...`
- Expiry: 7 hari

**Tampilan Email:**
- 🎨 Desain modern dengan branding DecoQ
- 📱 Responsive (mobile-friendly)
- 🔒 Secure token di URL

---

### 3️⃣ **Admin Baru Mengklik Link Konfirmasi**

**Halaman:** `/auth/confirm?token=abc123...`

**Proses Verifikasi:**
1. Sistem query database berdasarkan `invitation_token`
2. Validasi:
   - ✅ Token valid dan ditemukan
   - ✅ Token belum expired
   - ✅ User belum aktif
3. Jika valid, tampilkan form setup akun:
   - Nama lengkap
   - Password (min 8 karakter)
   - Konfirmasi password

---

### 4️⃣ **Admin Baru Mengatur Password**

**Proses Aktivasi:**
1. Admin mengisi form dan klik "Aktifkan Akun"
2. Sistem akan:
   - Membuat auth user di Supabase Auth (`signUp`)
   - Update user record:
     ```sql
     auth_user_id: 'uuid-from-supabase'
     status: 'active'
     is_active: true
     invitation_token: NULL
     invitation_expires_at: NULL
     ```
   - Log aktivasi ke `auth_logs`
3. Auto-login dan redirect ke `/dashboard`

**Status di Database:**
```sql
status: 'active'
is_active: true
auth_user_id: 'uuid-from-supabase'
invitation_token: NULL
```

---

## 📊 Status Badge di Manage Admin

### Status yang Ditampilkan:

| Status | Badge | Warna | Kondisi |
|--------|-------|-------|---------|
| **Pending** | ⏳ Pending | Kuning (#fbbf24) | Belum aktivasi |
| **Active** | ● Active | Hijau (#4ade80) | Sudah aktif |
| **Inactive** | ○ Inactive | Merah (#f87171) | Dinonaktifkan |

### Statistik Dashboard:

```
┌─────────────┬─────────┬────────┬─────────┬──────────┐
│ Superadmin  │  Admin  │ Active │ Pending │ Inactive │
│      1      │    2    │   2    │    1    │    0     │
└─────────────┴─────────┴────────┴─────────┴──────────┘
```

---

## 🗄️ Database Schema

### Kolom Baru di Tabel `users`:

```sql
-- Status user (pending, active, inactive)
status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive'))

-- Token untuk verifikasi email
invitation_token TEXT

-- Waktu expiry token (7 hari)
invitation_expires_at TIMESTAMP WITH TIME ZONE
```

### Update View `users_stats`:

```sql
CREATE VIEW users_stats AS
SELECT
  COUNT(*) FILTER (WHERE role = 'superadmin' AND is_active = TRUE) as total_superadmins,
  COUNT(*) FILTER (WHERE role = 'admin' AND is_active = TRUE) as total_admins,
  COUNT(*) FILTER (WHERE is_active = TRUE) as total_active_users,
  COUNT(*) FILTER (WHERE is_active = FALSE AND status != 'pending') as total_inactive_users,
  COUNT(*) FILTER (WHERE status = 'pending') as total_pending_users,
  COUNT(*) as total_users
FROM users;
```

---

## 🔧 Setup & Konfigurasi

### 1. Jalankan SQL Migration

```bash
# Di Supabase SQL Editor, jalankan:
ADD_PENDING_STATUS.sql
UPDATE_USERS_STATS_VIEW.sql
```

### 2. Konfigurasi Email (Nodemailer)

File: `.env.local`

```env
# Enable Nodemailer
USE_NODEMAILER=true

# Gmail Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=decoisme.works@gmail.com
EMAIL_PASSWORD=xlhj jjxc vpad adfu
EMAIL_FROM=DecoQ <decoisme.works@gmail.com>

# Site URL (untuk link konfirmasi)
NEXT_PUBLIC_SITE_URL=https://decoq.vercel.app
```

### 3. Deploy ke Production

```bash
npm run build
vercel --prod
```

---

## 🧪 Testing

### Test Flow Lengkap:

1. **Login sebagai Superadmin:**
   ```
   Email: adeirie@decoq.com
   Password: [your-password]
   ```

2. **Undang Admin Baru:**
   - Dashboard → Manage Admin → Invite Admin
   - Email: test@example.com
   - Role: Admin
   - Klik "Send Invite"

3. **Cek Email:**
   - Buka inbox `test@example.com`
   - Klik link "Accept Invitation"

4. **Setup Akun:**
   - Isi nama lengkap
   - Isi password (min 8 karakter)
   - Klik "Aktifkan Akun"

5. **Verifikasi:**
   - Auto-login ke dashboard
   - Cek Manage Admin → status berubah dari "Pending" ke "Active"
   - Statistik "Pending" berkurang, "Active" bertambah

---

## 🐛 Troubleshooting

### ❌ "Token tidak valid atau format salah"

**Penyebab:**
- Token tidak ditemukan di database
- Token sudah expired
- Token sudah digunakan

**Solusi:**
1. Cek database:
   ```sql
   SELECT email, invitation_token, invitation_expires_at, status
   FROM users
   WHERE email = 'test@example.com';
   ```
2. Jika expired, kirim ulang invite dari Manage Admin

---

### ❌ Email tidak terkirim (localhost)

**Error:** `self-signed certificate in certificate chain`

**Solusi:** Sudah diperbaiki dengan:
```typescript
tls: {
  rejectUnauthorized: false // Allow self-signed certificates
}
```

---

### ❌ Email tidak terkirim (production)

**Penyebab:**
- Environment variables tidak terset di Vercel
- Gmail App Password salah

**Solusi:**
1. Cek Vercel → Settings → Environment Variables
2. Pastikan semua env vars ada:
   - `USE_NODEMAILER=true`
   - `EMAIL_HOST=smtp.gmail.com`
   - `EMAIL_PORT=587`
   - `EMAIL_USER=...`
   - `EMAIL_PASSWORD=...`
3. Redeploy setelah update env vars

---

## 📝 API Endpoints

### POST `/api/admin/invite`

**Request:**
```json
{
  "email": "admin@example.com",
  "role": "admin",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invite berhasil dikirim ke admin@example.com",
  "method": "nodemailer",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    "invited_at": "2026-05-07T..."
  }
}
```

---

### GET `/api/admin/list-users`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "admin",
      "status": "pending",
      "is_active": false,
      "invitation_expires_at": "2026-05-14T...",
      "invited_at": "2026-05-07T..."
    }
  ],
  "stats": {
    "total_superadmins": 1,
    "total_admins": 2,
    "total_active_users": 2,
    "total_pending_users": 1,
    "total_inactive_users": 0,
    "total_users": 3
  }
}
```

---

## ✅ Checklist Implementasi

- [x] Database schema: `status`, `invitation_token`, `invitation_expires_at`
- [x] API `/api/admin/invite` dengan secure token generation
- [x] Email service dengan Nodemailer
- [x] Halaman konfirmasi `/auth/confirm`
- [x] Token verification dan validation
- [x] Account activation flow
- [x] Status badge di Manage Admin (Pending/Active/Inactive)
- [x] Update stats view dengan `total_pending_users`
- [x] Build passing tanpa error
- [x] SSL certificate fix untuk localhost

---

## 🚀 Next Steps

1. **Deploy ke Production:**
   ```bash
   vercel --prod
   ```

2. **Jalankan SQL Migration di Supabase:**
   - `ADD_PENDING_STATUS.sql`
   - `UPDATE_USERS_STATS_VIEW.sql`

3. **Test Full Flow:**
   - Invite admin baru
   - Cek email
   - Aktivasi akun
   - Verifikasi status

4. **Monitor Logs:**
   - Cek Vercel logs untuk email sending
   - Cek Supabase logs untuk database operations

---

## 📞 Support

Jika ada masalah, cek:
1. Vercel deployment logs
2. Supabase database logs
3. Browser console untuk frontend errors
4. Email inbox (termasuk spam folder)

---

**Status:** ✅ **READY FOR PRODUCTION**

**Last Updated:** May 7, 2026
