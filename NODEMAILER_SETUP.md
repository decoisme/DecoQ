# Nodemailer Setup Guide

## ✅ Fitur Baru: Custom Email Invitation

Sekarang Anda bisa mengirim email undangan admin dengan design custom menggunakan Nodemailer, sebagai alternatif dari Supabase Auth email default.

## 🎯 Keuntungan Nodemailer:

- ✅ **Custom Email Design** - Email lebih menarik dengan branding sendiri
- ✅ **No Supabase Dependency** - Tidak tergantung Supabase email quota
- ✅ **Flexible** - Bisa pakai Gmail, Outlook, atau SMTP server sendiri
- ✅ **Confirmation Page** - Penerima bisa set password sendiri
- ✅ **Fallback** - Jika gagal, otomatis pakai Supabase Auth

## 📦 Installation

### 1. Install Dependencies

```bash
npm install nodemailer @types/nodemailer
```

Jika ada error SSL certificate:
```bash
npm config set strict-ssl false
npm install nodemailer @types/nodemailer
npm config set strict-ssl true
```

### 2. Setup Email Provider

#### Option A: Gmail (Recommended)

1. **Enable 2-Factor Authentication**:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "DecoQ" or "QRIS Verifier"
   - Copy the 16-character password

3. **Add to `.env.local`**:
   ```env
   USE_NODEMAILER=true
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=DecoQ <your-email@gmail.com>
   ```

#### Option B: Outlook/Hotmail

```env
USE_NODEMAILER=true
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=DecoQ <your-email@outlook.com>
```

#### Option C: Custom SMTP Server

```env
USE_NODEMAILER=true
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USER=noreply@your-domain.com
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=DecoQ <noreply@your-domain.com>
```

### 3. Add Site URL

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production:
```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 🚀 How It Works

### Flow Diagram:

```
Superadmin invites user
        ↓
Check USE_NODEMAILER env
        ↓
    ┌───────┴───────┐
    ↓               ↓
Nodemailer      Supabase Auth
(custom)        (default)
    ↓               ↓
Send email      Send email
    ↓               ↓
User clicks     User clicks
confirmation    magic link
    ↓               ↓
/auth/confirm   /auth/callback
    ↓               ↓
Set password    Auto login
    ↓               ↓
Account active  Account active
```

### Nodemailer Flow:

1. **Superadmin invites** user via dashboard
2. **System generates** confirmation token (valid 7 days)
3. **Email sent** with custom HTML template
4. **User clicks** "Accept Invitation" button
5. **Redirected** to `/auth/confirm?token=xxx`
6. **User sets** password and full name
7. **Account activated** and redirected to dashboard

### Supabase Auth Flow (Fallback):

1. **Superadmin invites** user via dashboard
2. **Supabase sends** magic link email
3. **User clicks** magic link
4. **Redirected** to `/auth/callback`
5. **Auto login** and redirected to dashboard

## 📧 Email Template Preview

The custom email includes:
- ✅ Beautiful gradient design matching app theme
- ✅ Role badge (Superadmin/Admin)
- ✅ Clear CTA button
- ✅ Role description
- ✅ Expiration notice (7 days)
- ✅ Plain text fallback

## 🧪 Testing

### Test Email Configuration:

Create a test API endpoint:

```typescript
// pages/api/test-email.ts
import { sendTestEmail } from '../../lib/email'

export default async function handler(req, res) {
  const result = await sendTestEmail('your-email@gmail.com')
  res.json(result)
}
```

Then visit: `http://localhost:3000/api/test-email`

### Test Invitation Flow:

1. Login as superadmin
2. Go to "Manage Admin" tab
3. Invite a new admin
4. Check email inbox
5. Click "Accept Invitation"
6. Set password
7. Login with new account

## 🔧 Configuration Options

### Environment Variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `USE_NODEMAILER` | No | `false` | Enable Nodemailer |
| `EMAIL_HOST` | Yes* | `smtp.gmail.com` | SMTP server |
| `EMAIL_PORT` | Yes* | `587` | SMTP port |
| `EMAIL_USER` | Yes* | - | SMTP username |
| `EMAIL_PASSWORD` | Yes* | - | SMTP password |
| `EMAIL_FROM` | No | `EMAIL_USER` | From address |
| `NEXT_PUBLIC_SITE_URL` | Yes | `http://localhost:3000` | Site URL |

*Required only if `USE_NODEMAILER=true`

### Fallback Behavior:

- If `USE_NODEMAILER=false` → Always use Supabase Auth
- If `USE_NODEMAILER=true` but email config missing → Fallback to Supabase Auth
- If Nodemailer fails → Fallback to Supabase Auth
- Fallback is automatic and transparent

## 🐛 Troubleshooting

### Error: "UNABLE_TO_VERIFY_LEAF_SIGNATURE"

**Solution**: Disable SSL verification temporarily:
```bash
npm config set strict-ssl false
npm install nodemailer @types/nodemailer
npm config set strict-ssl true
```

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solution**: 
- Gmail: Use App Password, not regular password
- Enable 2FA first, then generate App Password
- Check EMAIL_USER is correct email address

### Error: "Connection timeout"

**Solution**:
- Check EMAIL_HOST and EMAIL_PORT
- Gmail: `smtp.gmail.com:587`
- Outlook: `smtp-mail.outlook.com:587`
- Check firewall/antivirus blocking port 587

### Email not received

**Solution**:
- Check spam folder
- Verify EMAIL_FROM is valid
- Check server logs for errors
- Test with `sendTestEmail()` function

### Token expired

**Solution**:
- Tokens valid for 7 days
- Request new invitation
- Check system time is correct

## 📊 Comparison

| Feature | Nodemailer | Supabase Auth |
|---------|------------|---------------|
| Custom design | ✅ Yes | ❌ No |
| Branding | ✅ Full control | ❌ Limited |
| Email quota | ✅ Unlimited* | ⚠️ Limited |
| Setup complexity | ⚠️ Medium | ✅ Easy |
| Confirmation page | ✅ Custom | ❌ Auto |
| Password setup | ✅ User choice | ✅ Auto |
| Fallback | ✅ Yes | - |

*Depends on SMTP provider

## 🎯 Recommendation

### For Development:
- Use Supabase Auth (easier setup)
- Or Gmail with App Password

### For Production:
- Use Nodemailer with custom SMTP
- Or professional email service (SendGrid, Mailgun, etc.)
- Configure proper SPF/DKIM records

## 📝 Files Created

- ✅ `lib/email.ts` - Email service with Nodemailer
- ✅ `pages/auth/confirm.tsx` - Confirmation page
- ✅ `pages/api/admin/invite.ts` - Updated with Nodemailer support
- ✅ `.env.example` - Updated with email config
- ✅ `NODEMAILER_SETUP.md` - This guide

## ✅ Summary

Nodemailer integration is complete! You can now:
- ✅ Send custom branded invitation emails
- ✅ Let users set their own password
- ✅ Have full control over email design
- ✅ Fallback to Supabase Auth if needed

**Next**: Install nodemailer and configure your email provider! 🚀
