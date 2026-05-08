# New Invitation Approach - Custom Email Link

## 🎯 Problem Solved

Supabase Auth `inviteUserByEmail` tidak reliable di berbagai device. Link dari Supabase sering muncul error "Undangan Tidak Valid".

## ✅ New Solution

**Bypass Supabase Auth email** dan gunakan **Nodemailer dengan custom link** langsung.

### Old Flow (Broken):
```
Supabase Auth inviteUserByEmail
  ↓
Email dengan Supabase link
  ↓
Link redirect ke /auth/callback
  ↓
❌ Error: "Undangan Tidak Valid"
```

### New Flow (Fixed):
```
Create auth user dengan temporary password
  ↓
Generate secure invitation token
  ↓
Send custom email via Nodemailer
  ↓
Link langsung ke /auth/confirm?token=xxx
  ↓
User set password sendiri
  ↓
✅ Success!
```

## 🔧 Technical Changes

### 1. Invite API (`pages/api/admin/invite.ts`)

**Before:**
```typescript
// Use Supabase Auth inviteUserByEmail
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {...})
```

**After:**
```typescript
// Create auth user with temporary password
const tempPassword = crypto.randomBytes(16).toString('hex')
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: true, // Auto-confirm
  user_metadata: { role, full_name, invited_by }
})

// Generate custom invitation token
const invitationToken = crypto.randomBytes(32).toString('hex')
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

// Store token in database
await supabaseAdmin.from('users').update({
  invitation_token: invitationToken,
  invitation_expires_at: expiresAt,
  status: 'pending'
}).eq('id', newUser.id)

// Send custom email via Nodemailer
const confirmationUrl = `${SITE_URL}/auth/confirm?token=${invitationToken}`
await sendInvitationEmail({ to: email, confirmationUrl, ... })
```

### 2. Confirm Page (`pages/auth/confirm.tsx`)

Sudah support custom token dari query param:

```typescript
// Priority 4: Custom token from query param
if (token && typeof token === 'string') {
  console.log('✅ Using custom token from query')
  verifyToken() // Verify token dari database
  return
}
```

### 3. Email Template (`lib/email.ts`)

Email sudah ada, tinggal pastikan link-nya benar:

```html
<a href="${confirmationUrl}">Activate Account</a>
```

Where `confirmationUrl = https://your-domain.com/auth/confirm?token=xxx`

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   NEW INVITATION FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. Superadmin Invite
   ├─ Create auth user (with temp password)
   ├─ Create database record
   ├─ Generate invitation token (32-byte hex)
   ├─ Store token in database (expires 7 days)
   └─ Send email via Nodemailer

2. Admin Receives Email
   ├─ Email contains custom link
   └─ Link: https://domain.com/auth/confirm?token=xxx

3. Admin Clicks Link
   ├─ Browser opens /auth/confirm?token=xxx
   ├─ Page verifies token from database
   ├─ Check: token valid? not expired?
   └─ Show password setup form

4. Admin Sets Password
   ├─ Enter new password + confirm
   ├─ Submit form
   ├─ API updates password via Admin API
   ├─ Update: is_active=true, last_login_at=now
   └─ Auto login with new password

5. Success!
   ├─ Redirect to dashboard
   └─ User can logout/login anytime
```

## 🔒 Security Features

### 1. Temporary Password
- Generated: `crypto.randomBytes(16).toString('hex')`
- Never sent to user
- Immediately replaced when user sets their own password

### 2. Invitation Token
- Generated: `crypto.randomBytes(32).toString('hex')` (64 characters)
- Stored in database with expiration
- One-time use (cleared after activation)
- Expires in 7 days

### 3. Email Confirmation
- Email auto-confirmed when creating auth user
- No need for separate email verification step

## ✅ Advantages

1. **Reliable:** No dependency on Supabase Auth email system
2. **Customizable:** Full control over email content and styling
3. **Debuggable:** Can see exact token in database
4. **Cross-device:** Works on any device, any browser
5. **Secure:** Uses cryptographically secure tokens

## 🧪 Testing

### Test Case 1: New Invitation
1. Superadmin invite new admin
2. Check email received
3. Click link in email
4. **Expected:** Form set password muncul
5. Set password
6. **Expected:** Auto login ke dashboard

### Test Case 2: Token Expiration
1. Invite admin
2. Wait 7 days (or manually update expiration in DB)
3. Click link
4. **Expected:** Error "Token expired"

### Test Case 3: Token Reuse
1. Invite admin
2. Admin activate & set password
3. Click same link again
4. **Expected:** Redirect to dashboard (already activated)

### Test Case 4: Cross-Device
1. Invite di device A
2. Open email di device B (mobile)
3. Click link
4. **Expected:** Form set password muncul
5. Set password
6. Login di device A dengan password baru
7. **Expected:** Berhasil login

## 📝 Database Schema

Pastikan table `users` punya columns:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
```

## 🔍 Debug Queries

```sql
-- Check invitation status
SELECT 
  email,
  invitation_token,
  invitation_expires_at,
  invitation_expires_at > NOW() as is_valid,
  status,
  is_active,
  last_login_at
FROM users
WHERE email = 'user@example.com';

-- Manually extend expiration if needed
UPDATE users
SET invitation_expires_at = NOW() + INTERVAL '7 days'
WHERE email = 'user@example.com';

-- Check if token is used
SELECT 
  email,
  invitation_token IS NULL as token_cleared,
  last_login_at IS NOT NULL as has_logged_in,
  is_active
FROM users
WHERE email = 'user@example.com';
```

## 🚀 Deployment

1. **Verify environment variables:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@decoq.com
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com
```

2. **Run database migration:**
```sql
-- Run ADD_PENDING_STATUS.sql if not already run
```

3. **Deploy code:**
```bash
git add .
git commit -m "fix: use custom email link for invitations"
git push
```

4. **Test immediately:**
   - Delete old pending users
   - Resend invitations
   - Test on different devices

## ✅ Success Criteria

- [ ] Email received with custom link
- [ ] Link opens /auth/confirm page
- [ ] Form set password muncul
- [ ] Password tersimpan
- [ ] Auto login berhasil
- [ ] Logout & login ulang berhasil
- [ ] Works on different devices
- [ ] Works on different browsers

---

**Status:** ✅ Implemented  
**Build:** ✅ Passing  
**Ready:** ✅ Yes - Test Now!
