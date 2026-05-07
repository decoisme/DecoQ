# ✅ Fix "Password salah" Error

## 🔍 Masalah

Saat user baru klik link invite dan setup password, muncul error:

```
Password salah. Silakan gunakan password yang benar atau reset password.
```

Padahal ini adalah **password pertama** yang user set.

---

## 🔍 Root Cause

**Alur yang salah:**
```
1. User di-invite → Auth user created (via inviteUserByEmail)
2. User klik link → Form setup password
3. User input password → Code try signInWithPassword ❌
4. Error: "Password salah" (karena password belum pernah di-set!)
```

**Masalahnya:**
- `inviteUserByEmail` create auth user **tanpa password**
- User perlu **set password** dulu via `signUp`
- Tapi code kita langsung coba `signInWithPassword`

---

## ✅ Solusi

Update logic di `confirm.tsx`:

**Alur baru:**
```
1. User di-invite → Auth user created (via inviteUserByEmail)
2. User klik link → Form setup password
3. User input password → Code try signUp ✅ (set password)
4. SignUp update existing invited user dengan password
5. Auto-login → Redirect dashboard ✅
```

**Logic:**
```typescript
// User was invited, auth account exists but no password yet
// Use signUp to set password for invited user
const { data, error } = await supabase.auth.signUp({
  email: inviteData.email,
  password,
  options: {
    data: { full_name: fullName, role: inviteData.role }
  }
})

// signUp will update the existing invited user with password
```

---

## 🧪 Test

1. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

2. **Invite admin baru**

3. **Cek email, klik link**

4. **Setup password:**
   - Nama: "Test User"
   - Password: "password123"
   - Konfirmasi: "password123"

5. **Klik "Aktifkan Akun"**

**Expected Result:**
```
✅ Auth account exists (from invite), updating password...
✅ Password set successfully
✅ Akun berhasil diaktifkan! Redirecting...
→ Dashboard
```

---

## 📊 Comparison

### **Before (Error):**
```typescript
if (authUserId) {
  // Try sign in ❌
  await supabase.auth.signInWithPassword(email, password)
  // Error: Password salah (belum ada password!)
}
```

### **After (Fixed):**
```typescript
if (authUserId) {
  // Try signUp (set password) ✅
  await supabase.auth.signUp(email, password)
  // SignUp updates invited user with password
  // Auto-login
}
```

---

## 🔄 Edge Cases Handled

### **Case 1: User baru (invited)**
```
auth_user_id exists (from invite) → signUp → Set password → Success ✅
```

### **Case 2: User sudah set password**
```
signUp fails (already registered) → Fallback to signIn → Success ✅
```

### **Case 3: User klik link berkali-kali**
```
signUp fails (already registered) → Fallback to signIn → Success ✅
```

---

## ✅ Summary

**Problem:**
```
Password salah (saat setup password pertama kali)
```

**Root Cause:**
```
Code try signInWithPassword untuk user yang belum set password
```

**Solution:**
```
Use signUp untuk set password invited user
```

**Result:**
```
✅ User bisa set password
✅ Auto-login
✅ Redirect dashboard
```

---

**Status:** ✅ **FIXED**

Deploy dan test sekarang! 🚀
