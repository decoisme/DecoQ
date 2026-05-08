# Troubleshooting Guide - Invitation Error

## 🔍 Step-by-Step Debug

### Step 1: Check Browser Console Logs

Minta user yang error untuk:
1. Buka link invitation di browser
2. Tekan `F12` untuk buka Developer Tools
3. Pilih tab **Console**
4. Screenshot semua log yang muncul
5. Kirim screenshot ke kamu

**Yang harus dicari:**
- ❌ Error merah
- ⚠️ Warning kuning
- 🔍 Log yang dimulai dengan emoji (🔍, ✅, ❌, ⚠️)

### Step 2: Check Network Tab

Di Developer Tools:
1. Pilih tab **Network**
2. Refresh page (F5)
3. Lihat request yang gagal (merah)
4. Klik request tersebut
5. Screenshot **Headers** dan **Response**

### Step 3: Check URL Format

Link invitation harus seperti ini:

**Format Supabase:**
```
https://xxxxx.supabase.co/auth/v1/verify?token=xxx&type=invite&redirect_to=https://your-domain.com/auth/callback
```

**Cek:**
- [ ] Ada `type=invite`?
- [ ] Ada `redirect_to`?
- [ ] Domain di `redirect_to` benar?

### Step 4: Test di Incognito/Private Mode

1. Buka browser Incognito/Private
2. Paste link invitation
3. Lihat apakah error sama

**Jika berhasil di Incognito:**
- Problem: Cache atau cookies
- Solution: Clear browser cache

### Step 5: Check Supabase Dashboard

1. Buka Supabase Dashboard
2. Go to: **Authentication → Users**
3. Cari email user yang error
4. Check status user:
   - [ ] User ada di list?
   - [ ] Status: Invited atau Confirmed?
   - [ ] Last Sign In: kapan?

### Step 6: Check Database

Jalankan query ini di Supabase SQL Editor:

```sql
-- Check user record
SELECT 
  id,
  email,
  role,
  status,
  is_active,
  auth_user_id,
  last_login_at,
  created_at,
  invited_at
FROM users
WHERE email = 'user@example.com';  -- Replace with actual email
```

**Expected result:**
- `auth_user_id`: NOT NULL (ada UUID)
- `is_active`: false
- `last_login_at`: NULL
- `status`: 'pending' atau NULL

**If `auth_user_id` is NULL:**
```sql
-- User record exists but no auth user
-- Solution: Delete and resend invitation
DELETE FROM users WHERE email = 'user@example.com';
```

### Step 7: Check Environment Variables

Di server/production, pastikan `.env` ada:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com  ← PENTING!
```

**CRITICAL:** `NEXT_PUBLIC_SITE_URL` harus domain production, bukan localhost!

### Step 8: Check Supabase Redirect URLs

1. Supabase Dashboard
2. **Authentication → URL Configuration**
3. **Redirect URLs** harus include:

```
https://your-domain.com/*
https://your-domain.com/auth/callback
https://your-domain.com/auth/confirm
```

### Step 9: Resend Invitation (Clean Slate)

1. **Delete user dari database:**
```sql
DELETE FROM users WHERE email = 'user@example.com';
```

2. **Delete dari Supabase Auth:**
   - Supabase Dashboard → Authentication → Users
   - Find user → Delete

3. **Resend invitation:**
   - Login sebagai superadmin
   - Manage Admin → Invite Admin
   - Masukkan email yang sama
   - Send

4. **Test immediately:**
   - Buka email
   - Klik link
   - Lihat console logs

### Step 10: Test with Different Email

Jika masih error, test dengan email berbeda:
1. Gunakan email lain (Gmail, Yahoo, etc.)
2. Send invitation
3. Buka di device yang sama
4. Lihat apakah berhasil

**Jika berhasil dengan email lain:**
- Problem: Email provider blocking atau filtering
- Solution: Whitelist sender email

## 🐛 Common Issues & Solutions

### Issue 1: "Undangan Tidak Valid"

**Possible causes:**
- Token expired
- User already activated
- Database record missing
- Auth user missing

**Solution:**
```sql
-- Check user status
SELECT * FROM users WHERE email = 'user@example.com';

-- If exists, delete and resend
DELETE FROM users WHERE email = 'user@example.com';
```

### Issue 2: Redirect Loop

**Symptoms:** Page keeps redirecting

**Solution:**
```javascript
// Clear all Supabase sessions
localStorage.clear()
sessionStorage.clear()
// Then try link again
```

### Issue 3: "User tidak ditemukan dalam sistem"

**Cause:** Auth user exists but no database record

**Solution:**
```sql
-- Check if auth_user_id exists in users table
SELECT auth_user_id FROM users WHERE email = 'user@example.com';

-- If NULL, delete auth user and resend
```

### Issue 4: Works on Your Device, Not Others

**Possible causes:**
1. **Different domain:** Your device uses localhost, others use production
2. **CORS issue:** Production domain not whitelisted
3. **Environment variables:** Production missing env vars

**Solution:**
1. Check `NEXT_PUBLIC_SITE_URL` in production
2. Add production domain to Supabase Redirect URLs
3. Verify all env vars deployed

### Issue 5: Email Link Opens Wrong URL

**Cause:** `redirect_to` parameter wrong

**Solution:**
Check invite API:
```typescript
// In pages/api/admin/invite.ts
redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
```

Make sure `NEXT_PUBLIC_SITE_URL` is set correctly!

## 📊 Debug Checklist

Before asking for help, complete this checklist:

- [ ] Browser console logs screenshot
- [ ] Network tab screenshot
- [ ] Email link format verified
- [ ] Tested in incognito mode
- [ ] Checked Supabase user status
- [ ] Ran database query
- [ ] Verified environment variables
- [ ] Checked Supabase redirect URLs
- [ ] Tried resending invitation
- [ ] Tested with different email

## 🆘 Still Not Working?

Provide these details:
1. **Console logs** (full screenshot)
2. **Network errors** (screenshot)
3. **Email link** (sanitized, hide sensitive parts)
4. **Database query result**
5. **Supabase user status**
6. **Environment** (production/development)
7. **Browser** (Chrome, Safari, etc.)
8. **Device** (Desktop, Mobile, OS)

## 🔧 Emergency Fix

If nothing works, use this temporary workaround:

1. **Create user manually in Supabase Auth:**
   - Supabase Dashboard → Authentication → Users
   - Add User → Email + Temporary Password

2. **Create database record:**
```sql
INSERT INTO users (email, role, full_name, is_active, auth_user_id)
VALUES (
  'user@example.com',
  'admin',
  'User Name',
  true,
  'auth-user-id-from-step-1'  -- Get from Supabase Auth Users
);
```

3. **Send password to user via secure channel**

4. **User can login immediately**

---

**Last Updated:** 2024  
**Status:** Active Troubleshooting Guide
