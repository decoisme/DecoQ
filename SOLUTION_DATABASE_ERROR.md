# ✅ Solusi: "Database error saving new user"

## 🔍 Root Cause

Error terjadi di **Supabase Auth** saat mencoba create auth user:

```
❌ Supabase invite error: AuthApiError: Database error saving new user
```

**Penyebab:**
Ada **database trigger** yang otomatis insert ke tabel `users` saat auth user dibuat, tapi trigger ini gagal karena:
1. Kolom `status` belum ada
2. Atau constraint lain yang tidak terpenuhi

---

## ✅ Solusi (Pilih Salah Satu)

### **Option 1: Disable Trigger (Recommended)** ⭐

Disable trigger dan biarkan API yang handle insert user record.

**Step 1: Buka Supabase SQL Editor**

**Step 2: Run query ini:**

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;

-- Drop function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_on_signup() CASCADE;

-- Verify
SELECT 
  'Trigger removed successfully' as status,
  COUNT(*) as remaining_triggers
FROM information_schema.triggers
WHERE event_object_schema = 'auth';
```

**Expected Output:**
```
status                        | remaining_triggers
------------------------------|-------------------
Trigger removed successfully  | 0
```

**Step 3: Test invite admin lagi**

Sekarang invite akan berhasil karena:
1. Supabase Auth create auth user ✅
2. API kita yang insert ke tabel `users` ✅
3. Tidak ada trigger yang interfere ✅

---

### **Option 2: Fix Trigger (Advanced)**

Jika Anda ingin tetap pakai trigger, update agar lebih robust:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert with only required columns
  INSERT INTO public.users (
    auth_user_id,
    email,
    role,
    is_active,
    full_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    false,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail auth user creation if insert fails
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

### **Option 3: Add Missing Columns**

Jika trigger butuh kolom `status`, tambahkan:

```sql
-- Add status column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('pending', 'active', 'inactive'));

-- Add token columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing users
UPDATE users SET status = 'active' WHERE is_active = true;
UPDATE users SET status = 'inactive' WHERE is_active = false;
```

Tapi ini **tidak recommended** karena trigger akan tetap interfere dengan API kita.

---

## 🎯 Recommended Flow

**Pilih Option 1** (Disable Trigger):

1. ✅ **Run SQL** untuk drop trigger
2. ✅ **Test invite** - sekarang akan berhasil
3. ✅ **API handle insert** - lebih kontrol dan error handling

**Kenapa Option 1 lebih baik:**
- ✅ Tidak perlu migration kolom
- ✅ API punya full control
- ✅ Better error handling
- ✅ Rollback protection (jika insert gagal, auth user di-delete)

---

## 🧪 Test Setelah Fix

1. **Run SQL** (Option 1)
2. **Test invite:**
   ```bash
   npm run dev
   ```
3. **Dashboard → Manage Admin → Invite Admin**
4. **Isi form → Send Invite**

**Expected Result:**
```
📨 Invite request received: { email: 'test@example.com', role: 'admin' }
✅ Current user: decoisme.works@gmail.com
📧 Sending invite via Supabase Auth to: test@example.com
✅ Supabase invite response: { user: { id: 'xxx' } }
✅ Invite sent via Supabase Auth, auth_user_id: xxx
💾 Inserting user record to database...
✅ User record created: yyy
✅ Invite berhasil dikirim
```

---

## 🐛 Jika Masih Error

### **Error: "Insert error: RLS policy"**

```sql
-- Allow service role to insert
CREATE POLICY "Service role can insert users"
ON users FOR INSERT
TO service_role
USING (true);
```

### **Error: "Foreign key constraint"**

Cek `invited_by` column:
```sql
-- Make invited_by nullable
ALTER TABLE users 
ALTER COLUMN invited_by DROP NOT NULL;
```

### **Error: "Unique constraint"**

Cek apakah email sudah ada:
```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

Jika ada, hapus:
```sql
DELETE FROM users WHERE email = 'test@example.com';
```

---

## 📊 Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **Option 1: Disable Trigger** | ✅ Simple<br>✅ Full control<br>✅ No migration | ❌ Manual insert |
| **Option 2: Fix Trigger** | ✅ Auto insert | ❌ Complex<br>❌ Less control |
| **Option 3: Add Columns** | ✅ Keep trigger | ❌ Need migration<br>❌ Still interfere |

---

## ✅ Summary

**Problem:**
```
Database error saving new user (di Supabase Auth)
```

**Root Cause:**
```
Database trigger gagal insert ke tabel users
```

**Solution:**
```sql
-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
```

**Result:**
```
✅ Invite berhasil
✅ Auth user created
✅ User record inserted by API
✅ Email terkirim
```

---

## 🚀 Quick Fix

```sql
-- Copy-paste ini ke Supabase SQL Editor
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

SELECT 'Trigger removed' as status;
```

Lalu test invite lagi! 🎉

---

**Status:** ✅ **SOLUTION READY**

**Last Updated:** May 7, 2026
