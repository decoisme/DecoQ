# Fix: Invitation Tidak Bisa Aktivasi di Device Lain

## 🐛 Problem

User yang menerima invitation email tidak bisa aktivasi akun di device mereka. Muncul error "Undangan Tidak Valid" atau "Undangan tidak valid atau sudah digunakan."

Error ini terjadi di device orang lain, tapi berhasil di device developer.

## 🔍 Root Cause

Ada **mismatch** antara flow invitation:

### Flow Lama (Broken):
```
1. Superadmin invite → Supabase Auth kirim email
2. Admin klik link → Redirect ke /auth/callback
3. Callback langsung redirect ke /dashboard ❌
4. Admin belum set password!
5. Logout → Login gagal (no password)
```

### Masalah:
- **Callback page** langsung redirect ke dashboard tanpa set password
- **Confirm page** mencari `invitation_token` di database, tapi Supabase Auth tidak menggunakan token ini
- Link dari Supabase Auth menggunakan `access_token` di hash URL, bukan custom token

## ✅ Solution

### 1. Update Callback Page
**File:** `pages/auth/callback.tsx`

Tambahkan check: jika first time login (no `last_login_at`), redirect ke confirm page untuk set password:

```typescript
// Check if user exists in users table
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('role, is_active, email, last_login_at')  // ← Added last_login_at
  .eq('auth_user_id', session.user.id)
  .single()

// If this is first time (no last_login_at), redirect to confirm page
if (!userData.last_login_at) {
  console.log('First time login, redirecting to confirm page...')
  router.push(`/auth/confirm?access_token=${accessToken}&refresh_token=${refreshToken}`)
  return
}

// Otherwise, proceed to dashboard
```

### 2. Update Confirm Page
**File:** `pages/auth/confirm.tsx`

Tambahkan support untuk Supabase Auth tokens:

```typescript
useEffect(() => {
  // Check for access_token from query params (redirected from callback)
  const { access_token, refresh_token } = router.query
  
  if (access_token && typeof access_token === 'string') {
    console.log('✅ Using tokens from callback redirect')
    verifySupabaseAuthInvite(access_token, refresh_token as string || null)
    return
  }
  
  // Fallback: Check hash params (direct from email - shouldn't happen)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const hashAccessToken = hashParams.get('access_token')
  const hashRefreshToken = hashParams.get('refresh_token')
  const type = hashParams.get('type')
  
  if (hashAccessToken && type === 'invite') {
    verifySupabaseAuthInvite(hashAccessToken, hashRefreshToken)
    return
  }
  
  // Old method: custom token
  if (!token) return
  verifyToken()
}, [router.query, token])
```

Tambahkan function `verifySupabaseAuthInvite`:

```typescript
const verifySupabaseAuthInvite = async (accessToken: string, refreshToken: string | null) => {
  try {
    // Set the session
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    })
    
    if (sessionError) {
      setStatus('error')
      setMessage('Link undangan tidak valid atau sudah kadaluarsa.')
      return
    }
    
    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, full_name, is_active')
      .eq('auth_user_id', sessionData.user?.id)
      .single()
    
    if (userError || !userData) {
      setStatus('error')
      setMessage('User tidak ditemukan dalam sistem.')
      return
    }
    
    // Show setup form
    setInviteData({
      email: userData.email,
      role: userData.role as 'admin' | 'superadmin',
      userId: userData.id
    })
    setFullName(userData.full_name || '')
    setStatus('success')
    setMessage('Undangan valid! Silakan set password Anda.')
    
  } catch (error) {
    setStatus('error')
    setMessage('Terjadi kesalahan saat memverifikasi undangan.')
  }
}
```

## 📊 New Flow (Fixed)

```
1. Superadmin invite → Supabase Auth kirim email
   ↓
2. Admin klik link → Redirect ke /auth/callback
   ↓
3. Callback check: first time login?
   ├─ YES → Redirect ke /auth/confirm dengan tokens
   └─ NO → Redirect ke /dashboard
   ↓
4. Confirm page: Set password form
   ↓
5. Password tersimpan via Admin API
   ↓
6. Auto login → Dashboard ✅
```

## 🎯 Key Changes

### Before:
- ❌ Callback langsung ke dashboard
- ❌ User tidak set password
- ❌ Login gagal setelah logout

### After:
- ✅ Callback check first time login
- ✅ Redirect ke confirm untuk set password
- ✅ Password tersimpan dengan benar
- ✅ Login berhasil setelah logout

## 🧪 Testing

### Test Case 1: New Invitation
1. Superadmin invite admin baru
2. Admin buka email di device mereka
3. Klik link invitation
4. **Expected:** Redirect ke confirm page (bukan dashboard)
5. Form set password muncul
6. Set password
7. **Expected:** Auto login ke dashboard
8. Logout
9. Login dengan email + password baru
10. **Expected:** Berhasil login

### Test Case 2: Existing User (Re-login)
1. User yang sudah pernah login
2. Klik link invitation lagi (jika ada)
3. **Expected:** Langsung ke dashboard (skip confirm)

### Test Case 3: Cross-Device
1. Invite di device A
2. Buka link di device B (mobile)
3. **Expected:** Berhasil aktivasi
4. Set password di device B
5. Login di device A dengan password baru
6. **Expected:** Berhasil login

## 🔍 Debug Queries

Jika masih ada masalah, jalankan query ini di Supabase SQL Editor:

```sql
-- Check user status
SELECT 
  email,
  role,
  status,
  is_active,
  auth_user_id IS NOT NULL as has_auth,
  last_login_at,
  created_at
FROM users
WHERE email = 'user@example.com';  -- Replace with actual email

-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('last_login_at', 'status', 'invitation_token');

-- Add missing columns if needed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
```

## 📝 Files Modified

1. **`pages/auth/callback.tsx`**
   - Added `last_login_at` check
   - Redirect to confirm page for first time users

2. **`pages/auth/confirm.tsx`**
   - Added support for Supabase Auth tokens
   - Added `verifySupabaseAuthInvite` function
   - Handle tokens from query params and hash

3. **`DEBUG_INVITATION_TOKEN.sql`** (New)
   - Debug queries untuk troubleshooting

## ✅ Build Status

```bash
npm run build
✓ Compiled successfully
```

## 🚀 Deployment

1. Commit changes:
```bash
git add .
git commit -m "fix: invitation activation on other devices"
git push
```

2. Test on production:
   - Send new invitation
   - Test on different device
   - Verify password setup works
   - Verify login works after logout

## 📞 Support

Jika masih ada masalah:
1. Check browser console logs
2. Run debug SQL queries
3. Verify email link format
4. Check Supabase Auth settings

---

**Status:** ✅ Fixed  
**Build:** ✅ Passing  
**Tested:** ✅ Ready for testing
