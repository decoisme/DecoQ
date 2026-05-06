# ⚡ Quick Login Setup - 5 Menit

## 🎯 Cara Cepat Setup Superadmin Pertama

### **1. Invite User (2 menit)**

```
Supabase Dashboard
→ Authentication
→ Users
→ Invite User
→ Masukkan email Anda
→ Send Invite
```

### **2. Set Password (1 menit)**

```
Check email Anda
→ Klik link dari Supabase
→ Set password
→ Confirm
```

### **3. Get User ID (1 menit)**

```
Supabase Dashboard
→ Authentication
→ Users
→ Klik user yang baru dibuat
→ Copy "ID" (UUID)
```

### **4. Insert ke Database (1 menit)**

```sql
-- Supabase SQL Editor
INSERT INTO users (email, role, full_name, auth_user_id, is_active)
VALUES (
  'your-email@example.com',     -- Email Anda
  'superadmin',
  'Your Name',
  'paste-user-id-here',         -- ID dari step 3
  TRUE
);
```

### **5. Login! (30 detik)**

```
http://localhost:3000/auth/login

Email: your-email@example.com
Password: [password dari step 2]
```

---

## 🔑 Template SQL (Copy-Paste Ready)

```sql
-- GANTI 3 NILAI INI:
-- 1. your-email@example.com → Email Anda
-- 2. Your Name → Nama Anda
-- 3. paste-user-id-here → User ID dari Supabase

INSERT INTO users (email, role, full_name, auth_user_id, is_active)
VALUES (
  'your-email@example.com',
  'superadmin',
  'Your Name',
  'paste-user-id-here',
  TRUE
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'superadmin', 
  auth_user_id = EXCLUDED.auth_user_id, 
  is_active = TRUE;

-- Verify
SELECT * FROM users WHERE email = 'your-email@example.com';
```

---

## ✅ Checklist

- [ ] Invite user via Supabase Dashboard
- [ ] Check email & set password
- [ ] Copy user ID dari Supabase
- [ ] Run SQL INSERT
- [ ] Verify user exists: `SELECT * FROM users`
- [ ] Test login di http://localhost:3000/auth/login
- [ ] Success! ✅

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Email tidak masuk | Check spam, atau resend invite |
| Link expired | Delete user & invite lagi |
| "User tidak ditemukan" | Run SQL INSERT (step 4) |
| "Invalid credentials" | Reset password di Supabase Dashboard |
| "Akun tidak aktif" | `UPDATE users SET is_active = TRUE` |

---

## 📞 Need Help?

**Detailed Guide:** Buka `FIRST_LOGIN_GUIDE.md`

**Common Issues:**
1. Lupa run SQL INSERT → User tidak ada di `users` table
2. Salah copy User ID → Auth user ID tidak match
3. Email typo → Email di invite ≠ email di SQL

---

**Total Time: ~5 menit** ⏱️

**Setelah setup, Anda bisa invite admin lain via UI!** 🎉
