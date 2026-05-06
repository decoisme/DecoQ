# 🔧 Fix Email Redirect ke Homepage

## ❓ Masalah

Saat klik link dari email invite Supabase, malah redirect ke **homepage** instead of dashboard.

**Penyebab:**
- Supabase redirect URL belum dikonfigurasi
- Callback page belum handle hash-based redirect

---

## ✅ Solusi (2 Langkah)

### **Step 1: Konfigurasi Supabase Redirect URL**

1. **Buka Supabase Dashboard**: https://app.supabase.com
2. Pilih project **DecoQ**
3. Klik **Authentication** di sidebar kiri
4. Klik **URL Configuration**
5. Tambahkan redirect URLs:

   **Site URL:**
   ```
   http://localhost:3000
   ```

   **Redirect URLs** (tambahkan semua ini):
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   http://localhost:3000
   ```

   **Untuk production (jika sudah deploy):**
   ```
   https://your-domain.vercel.app/auth/callback
   https://your-domain.vercel.app/dashboard
   https://your-domain.vercel.app
   ```

6. **Klik "Save"**

---

### **Step 2: Update Email Templates (Optional)**

Jika ingin customize email template:

1. Masih di **Authentication** → **Email Templates**
2. Pilih **"Invite user"** template
3. Update redirect URL di template:

   **Before:**
   ```html
   <a href="{{ .ConfirmationURL }}">Accept Invite</a>
   ```

   **After:**
   ```html
   <a href="{{ .ConfirmationURL }}">Accept Invite</a>
   ```

   (Sebenarnya sama, tapi pastikan `{{ .ConfirmationURL }}` ada)

4. **Klik "Save"**

---

## 🧪 Test Email Invite Flow

### **Step 1: Invite User**

1. Login sebagai superadmin
2. Buka: http://localhost:3000/manage-admin
3. Klik "Invite Admin"
4. Masukkan email test
5. Klik "Send Invite"

---

### **Step 2: Check Email**

1. Buka email yang di-invite
2. Cari email dari Supabase
3. Klik link "Accept Invite" atau "Confirm Email"

---

### **Step 3: Expected Flow**

```
Klik link di email
  ↓
Redirect ke: http://localhost:3000/auth/callback#access_token=...
  ↓
Callback page process token
  ↓
Check user in database
  ↓
Activate user (set is_active = TRUE)
  ↓
Redirect ke: http://localhost:3000/dashboard
  ✅ Dashboard muncul!
```

---

## 🐛 Troubleshooting

### Issue: Masih redirect ke homepage

**Check 1: Apakah redirect URL sudah dikonfigurasi?**

```
Supabase Dashboard → Authentication → URL Configuration
→ Check "Redirect URLs" list
→ Harus ada: http://localhost:3000/auth/callback
```

**Check 2: Apakah link di email benar?**

Link di email harus seperti ini:
```
http://localhost:3000/auth/callback#access_token=...&refresh_token=...&type=invite
```

Bukan seperti ini:
```
https://zbblqmqgwzrhrcrofghr.supabase.co/auth/v1/verify?token=...
```

**Solution:**
- Update email template di Supabase
- Atau update "Site URL" di Supabase settings

---

### Issue: "User tidak ditemukan dalam sistem"

**Cause:** User belum di-insert ke table `users`

**Solution:**

1. **Get auth_user_id** dari Supabase Dashboard:
   - Authentication → Users → Click user → Copy ID

2. **Insert ke users table**:
   ```sql
   INSERT INTO users (email, role, full_name, auth_user_id, is_active)
   VALUES (
     'user@example.com',
     'admin',
     'User Name',
     'paste-auth-user-id-here',
     TRUE
   );
   ```

---

### Issue: Callback page stuck loading

**Check browser console:**

```
F12 → Console tab
→ Look for errors
```

**Common errors:**

1. **"Session error"**
   - Token expired
   - Solution: Request new invite

2. **"User not found"**
   - User not in `users` table
   - Solution: Insert user (see above)

3. **"Network error"**
   - Supabase connection issue
   - Solution: Check `.env.local` credentials

---

## 🔍 Debug Mode

Untuk debug callback flow, buka browser console dan check logs:

```javascript
// Callback page akan log:
console.log('Callback type:', type)
console.log('Has access token:', !!accessToken)
console.log('Session established for:', session.user.email)
console.log('Redirecting to dashboard...')
```

**Expected logs:**
```
Callback type: invite
Has access token: true
Session established for: user@example.com
Redirecting to dashboard...
```

---

## 📝 Alternative: Manual Signup (Bypass Email)

Jika email invite masih bermasalah, gunakan metode manual:

**Method 1: Direct SQL Insert**
- See: [QUICK_CREATE_SUPERADMIN.md](QUICK_CREATE_SUPERADMIN.md)

**Method 2: Signup Page**
- See: [SETUP_WITHOUT_EMAIL.md](SETUP_WITHOUT_EMAIL.md)

---

## ✅ Verification Checklist

Sebelum test, pastikan:

- [ ] Supabase redirect URLs sudah dikonfigurasi
- [ ] Site URL di Supabase = `http://localhost:3000`
- [ ] Callback page updated (file `pages/auth/callback.tsx`)
- [ ] Development server sudah restart
- [ ] User sudah ada di table `users` (atau akan auto-create)

---

## 🎯 Quick Fix Summary

**1. Konfigurasi Supabase:**
```
Dashboard → Authentication → URL Configuration
→ Add: http://localhost:3000/auth/callback
→ Save
```

**2. Restart Server:**
```bash
npm run dev
```

**3. Test Invite:**
```
1. Invite user via UI
2. Check email
3. Klik link
4. Should redirect to dashboard ✅
```

---

## 🚀 Expected Result

**After fix:**
- ✅ Klik link di email
- ✅ Redirect ke `/auth/callback`
- ✅ Loading spinner muncul
- ✅ Auto-redirect ke `/dashboard`
- ✅ Dashboard muncul dengan UI lengkap

**No more redirect ke homepage!** 🎉

