# Debug Checklist - Invitation Error

## Step 1: Check Email Link Format

Buka email invitation yang diterima user. Link-nya harus seperti ini:

```
https://your-project.supabase.co/auth/v1/verify?token=xxx&type=invite&redirect_to=https://your-domain.com/auth/callback
```

**Cek:**
- [ ] Ada parameter `type=invite`?
- [ ] Ada parameter `redirect_to`?
- [ ] `redirect_to` mengarah ke domain yang benar?

## Step 2: Check Supabase Email Template

1. Buka Supabase Dashboard
2. Go to: **Authentication → Email Templates**
3. Pilih: **Invite user**
4. Pastikan ada `{{ .ConfirmationURL }}`

## Step 3: Check Environment Variable

Di `.env.local`, pastikan ada:

```env
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com
```

**PENTING:** Jangan pakai `localhost` jika testing di device lain!

## Step 4: Check Supabase Redirect URLs

1. Buka Supabase Dashboard
2. Go to: **Authentication → URL Configuration**
3. Tambahkan ke **Redirect URLs**:
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/auth/confirm`
   - `http://localhost:3000/auth/callback` (untuk development)

## Step 5: Resend Invitation

Setelah fix di atas, **DELETE user lama** dan **resend invitation baru**.

```sql
-- Delete user lama
DELETE FROM users WHERE email = 'user@example.com';

-- Resend invitation dari dashboard
```
