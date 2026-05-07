# Password Reset Feature - Complete Guide

## Overview
Fitur reset password dengan sistem approval dari superadmin. Admin yang lupa password dapat mengajukan permintaan reset, dan superadmin akan mereview untuk approve atau reject.

---

## Flow Diagram

```
Admin Lupa Password
    ↓
Klik "Lupa password?" di login page
    ↓
Isi form (email, nama, alasan)
    ↓
Submit request → Tersimpan di database (status: pending)
    ↓
Superadmin melihat request di dashboard
    ↓
    ├─→ APPROVE
    │   ├─ Generate reset token (valid 1 jam)
    │   ├─ Kirim email dengan link reset
    │   └─ Admin klik link → Form reset password
    │       ├─ Masukkan password baru
    │       ├─ Password tersimpan
    │       └─ Redirect ke login
    │
    └─→ REJECT
        ├─ Isi alasan penolakan
        └─ Kirim email penolakan dengan alasan
```

---

## Database Schema

### Table: `password_reset_requests`

```sql
CREATE TABLE password_reset_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  reset_token TEXT UNIQUE,
  reset_token_expires_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status Values:**
- `pending` - Request baru, menunggu review superadmin
- `approved` - Disetujui, email reset sudah dikirim
- `rejected` - Ditolak oleh superadmin
- `completed` - Password sudah berhasil direset

---

## Files Created/Modified

### New Files:
1. **`components/PasswordResetRequestsTab.tsx`**
   - Component untuk superadmin mengelola password reset requests
   - Features: List requests, approve/reject dengan modal, filter by status

2. **`pages/auth/forgot-password.tsx`**
   - Form untuk admin request reset password
   - Input: email, nama lengkap, alasan (optional)

3. **`pages/auth/reset-password.tsx`**
   - Form untuk set password baru setelah approved
   - Validasi token, password strength check

4. **`pages/api/auth/request-password-reset.ts`**
   - API untuk submit request reset password
   - Validasi email, simpan ke database

5. **`pages/api/auth/validate-reset-token.ts`**
   - API untuk validasi reset token
   - Check token valid dan belum expired

6. **`pages/api/auth/reset-password.ts`**
   - API untuk update password baru
   - Menggunakan Supabase Admin API

7. **`pages/api/admin/password-reset-requests.ts`**
   - API untuk superadmin manage requests
   - GET: List requests by status
   - PATCH: Approve/reject request

8. **`CREATE_PASSWORD_RESET_TABLE.sql`**
   - SQL migration untuk create table dan RLS policies

### Modified Files:
1. **`components/Sidebar.tsx`**
   - Added "Password Reset" menu item (superadmin only)

2. **`pages/dashboard.tsx`**
   - Added password-reset tab case
   - Import PasswordResetRequestsTab component

3. **`pages/auth/login.tsx`**
   - Added "Lupa password?" link

---

## API Endpoints

### 1. Request Password Reset
**POST** `/api/auth/request-password-reset`

**Body:**
```json
{
  "email": "admin@example.com",
  "fullName": "John Doe",
  "reason": "Lupa password setelah cuti panjang"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permintaan reset password telah dikirim"
}
```

---

### 2. List Password Reset Requests (Superadmin)
**GET** `/api/admin/password-reset-requests?status=pending`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Query Params:**
- `status` - pending | approved | rejected

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "full_name": "John Doe",
      "reason": "Lupa password",
      "status": "pending",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

---

### 3. Approve/Reject Request (Superadmin)
**PATCH** `/api/admin/password-reset-requests`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Body (Approve):**
```json
{
  "requestId": "uuid",
  "action": "approve"
}
```

**Body (Reject):**
```json
{
  "requestId": "uuid",
  "action": "reject",
  "rejectionReason": "Alasan tidak valid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request disetujui dan email telah dikirim"
}
```

---

### 4. Validate Reset Token
**GET** `/api/auth/validate-reset-token?token=<reset_token>`

**Response:**
```json
{
  "valid": true,
  "email": "admin@example.com"
}
```

---

### 5. Reset Password
**POST** `/api/auth/reset-password`

**Body:**
```json
{
  "token": "reset_token_here",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password berhasil direset"
}
```

---

## Email Templates

### Approval Email
- **Subject:** ✅ Password Reset Request Approved
- **Content:** Link reset password (valid 1 jam)
- **Style:** Dark theme dengan green accent

### Rejection Email
- **Subject:** ❌ Password Reset Request Rejected
- **Content:** Alasan penolakan
- **Style:** Dark theme dengan red accent

---

## Security Features

1. **Token Security:**
   - Reset token: 32-byte random hex (64 characters)
   - Token expires in 1 hour
   - One-time use (cleared after password reset)

2. **Access Control:**
   - Only superadmin can approve/reject requests
   - RLS policies enforce role-based access

3. **Password Requirements:**
   - Minimum 8 characters
   - Confirmation required

4. **Audit Logging:**
   - All approve/reject actions logged
   - Includes reviewer ID, timestamp, IP address

---

## User Guide

### For Admin (Lupa Password):

1. **Request Reset:**
   - Buka halaman login
   - Klik "Lupa password?"
   - Isi email, nama lengkap, dan alasan
   - Submit request

2. **Wait for Approval:**
   - Tunggu email notifikasi dari superadmin
   - Biasanya 1-24 jam

3. **Reset Password (jika approved):**
   - Buka email approval
   - Klik link reset password
   - Masukkan password baru (min 8 karakter)
   - Konfirmasi password
   - Submit → Redirect ke login

4. **Login dengan Password Baru:**
   - Gunakan email dan password baru
   - Akses dashboard seperti biasa

---

### For Superadmin (Review Requests):

1. **Access Password Reset Tab:**
   - Login ke dashboard
   - Klik "Password Reset" di sidebar (hanya superadmin)

2. **Review Pending Requests:**
   - Lihat list pending requests
   - Check email, nama, alasan
   - Decide: Approve atau Reject

3. **Approve Request:**
   - Klik tombol "Approve"
   - Konfirmasi di modal
   - Email reset otomatis terkirim ke admin

4. **Reject Request:**
   - Klik tombol "Reject"
   - Isi alasan penolakan
   - Konfirmasi di modal
   - Email rejection otomatis terkirim

5. **View History:**
   - Filter by status: Pending, Approved, Rejected
   - Lihat timestamp review
   - Track semua requests

---

## Installation Steps

### 1. Run SQL Migration
```bash
# Copy SQL dari CREATE_PASSWORD_RESET_TABLE.sql
# Paste dan execute di Supabase SQL Editor
```

### 2. Verify Table Created
```sql
SELECT * FROM password_reset_requests LIMIT 1;
```

### 3. Test Flow
1. Logout dari dashboard
2. Klik "Lupa password?" di login
3. Submit request dengan email superadmin
4. Login sebagai superadmin
5. Buka tab "Password Reset"
6. Approve request
7. Check email untuk link reset
8. Reset password
9. Login dengan password baru

---

## Troubleshooting

### Issue: Email tidak terkirim
**Solution:**
- Check environment variables di `.env.local`:
  ```
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASSWORD=your-app-password
  EMAIL_FROM=noreply@decoq.com
  ```
- Pastikan SMTP credentials valid
- Check nodemailer logs di console

### Issue: Token expired
**Solution:**
- Token valid 1 jam setelah approval
- Request reset baru jika sudah expired
- Superadmin approve ulang

### Issue: Password tidak tersimpan
**Solution:**
- Check Supabase Admin API credentials
- Verify `SUPABASE_SERVICE_ROLE_KEY` di `.env.local`
- Check console logs untuk error details

### Issue: Tab tidak muncul di sidebar
**Solution:**
- Pastikan login sebagai superadmin (bukan admin biasa)
- Check role di database: `SELECT role FROM users WHERE email = 'your-email'`
- Refresh browser

---

## Testing Checklist

- [ ] Admin dapat submit request reset password
- [ ] Request tersimpan di database dengan status pending
- [ ] Superadmin dapat melihat pending requests
- [ ] Superadmin dapat approve request
- [ ] Email approval terkirim dengan link reset
- [ ] Link reset valid dan dapat dibuka
- [ ] Form reset password berfungsi
- [ ] Password baru tersimpan di database
- [ ] Admin dapat login dengan password baru
- [ ] Superadmin dapat reject request
- [ ] Email rejection terkirim dengan alasan
- [ ] Token expired setelah 1 jam
- [ ] Token cleared setelah password direset
- [ ] Audit logs mencatat approve/reject actions

---

## Future Enhancements

1. **Notification Badge:**
   - Show pending count di sidebar
   - Real-time updates dengan Supabase Realtime

2. **Auto-Expire Old Requests:**
   - Cron job untuk auto-reject requests > 7 hari

3. **Password Strength Meter:**
   - Visual indicator untuk password strength
   - Suggestions untuk password yang lebih kuat

4. **2FA Integration:**
   - Optional 2FA untuk reset password
   - SMS/Email OTP verification

5. **Request History:**
   - Admin dapat melihat history request mereka sendiri
   - Track berapa kali request reset

---

## Support

Jika ada pertanyaan atau issue:
1. Check troubleshooting section di atas
2. Review console logs untuk error details
3. Verify database schema dan RLS policies
4. Contact developer team

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** ✅ Production Ready
