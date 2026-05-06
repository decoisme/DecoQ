# 🚨 Solusi Email Limit Supabase

## Masalah
Supabase Anda **limit untuk send email**, sehingga tidak bisa invite admin via email.

---

## ✅ Solusi Tercepat (2 Menit)

Gunakan **Direct SQL Insert** untuk create superadmin tanpa email:

### 📖 Panduan Lengkap
**[QUICK_CREATE_SUPERADMIN.md](QUICK_CREATE_SUPERADMIN.md)**

### 🎯 Ringkasan Singkat

1. **Disable email confirmation** di Supabase:
   - Dashboard → Authentication → Providers → Email
   - Uncheck "Enable email confirmations"
   - Save

2. **Run SQL query** di Supabase SQL Editor:
   ```sql
   -- Create auth user
   INSERT INTO auth.users (
     instance_id, id, aud, role, email,
     encrypted_password,
     email_confirmed_at, recovery_sent_at, last_sign_in_at,
     raw_app_meta_data, raw_user_meta_data,
     created_at, updated_at,
     confirmation_token, email_change, email_change_token_new, recovery_token
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated', 'authenticated',
     'superadmin@decoq.com',              -- GANTI email
     crypt('admin123', gen_salt('bf')),   -- GANTI password
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}', '{}',
     NOW(), NOW(), '', '', '', ''
   )
   RETURNING id;
   ```

3. **Copy ID** yang muncul (contoh: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

4. **Insert ke users table**:
   ```sql
   INSERT INTO users (email, role, full_name, auth_user_id, is_active)
   VALUES (
     'superadmin@decoq.com',           -- Email yang SAMA
     'superadmin',
     'Super Admin',
     'paste-id-here',                  -- ID dari step 3
     TRUE
   );
   ```

5. **Login**:
   - URL: http://localhost:3000/auth/login
   - Email: `superadmin@decoq.com`
   - Password: `admin123`

---

## 🎉 Done!

Setelah login berhasil, Anda bisa:
- ✅ Access dashboard: http://localhost:3000/dashboard
- ✅ Manage admin: http://localhost:3000/manage-admin
- ✅ Invite admin lain via UI (jika email limit sudah teratasi)

---

## 📚 Dokumentasi Alternatif

Jika cara di atas tidak berhasil, coba metode lain:

1. **[SETUP_WITHOUT_EMAIL.md](SETUP_WITHOUT_EMAIL.md)** — 3 metode bypass email limit
2. **[FIRST_LOGIN_GUIDE.md](FIRST_LOGIN_GUIDE.md)** — Via email invite (jika email sudah bisa)

---

## 🔒 Security Note

Setelah create superadmin:
1. ✅ Enable email confirmation kembali di Supabase
2. ✅ Ganti password via UI
3. ✅ Use invite system untuk admin berikutnya

