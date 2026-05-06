# 🔧 Fix: "supabaseKey is required" Error

## ❌ Error

```
Error: supabaseKey is required.
POST /api/register 500 in 9ms
```

---

## 🎯 Penyebab

File `lib/supabase.ts` menggunakan `NEXT_PUBLIC_SUPABASE_ANON_KEY` tapi di `.env.local` kita pakai `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

**Mismatch:**
- Code: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Env: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

---

## ✅ Solusi

### **Step 1: Update lib/supabase.ts**

File sudah diupdate untuk support both keys:

```typescript
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

### **Step 2: Restart Development Server**

```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🧪 Test

1. **Buka:** http://localhost:3000/auth/login
2. **Login** dengan credentials Anda
3. **Dashboard** seharusnya muncul tanpa error ✅

---

## 📝 Environment Variables Reference

**Required variables in `.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Alternative (legacy):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Both work now!** ✅

---

## ✅ Fixed!

Error "supabaseKey is required" sudah teratasi! 🎉

**Restart server dan test sekarang!**

