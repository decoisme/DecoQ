# 🚀 Deployment Checklist - Password Reset Feature

## Pre-Deployment Steps

### 1. Database Migration ✅
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy content from `CREATE_PASSWORD_RESET_TABLE.sql`
- [ ] Execute SQL script
- [ ] Verify table created:
  ```sql
  SELECT * FROM password_reset_requests LIMIT 1;
  ```
- [ ] Check RLS policies enabled:
  ```sql
  SELECT tablename, policyname 
  FROM pg_policies 
  WHERE tablename = 'password_reset_requests';
  ```

### 2. Environment Variables ✅
Check `.env.local` contains:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@decoq.com

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change to production URL
```

### 3. Build Verification ✅
```bash
npm run build
# Should show: ✓ Compiled successfully
```

---

## Testing Checklist

### Test 1: Admin Request Flow
- [ ] Logout dari dashboard
- [ ] Buka `/auth/login`
- [ ] Klik "Lupa password?"
- [ ] Isi form:
  - Email: (email admin yang ada di database)
  - Nama: (nama lengkap)
  - Alasan: "Testing password reset feature"
- [ ] Submit form
- [ ] Verify success page muncul
- [ ] Check database:
  ```sql
  SELECT * FROM password_reset_requests 
  WHERE email = 'your-test-email@example.com' 
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Verify status = 'pending'

### Test 2: Superadmin Approval
- [ ] Login sebagai superadmin
- [ ] Verify tab "Password Reset" muncul di sidebar
- [ ] Klik tab "Password Reset"
- [ ] Verify request muncul di list
- [ ] Klik tombol "Approve"
- [ ] Verify modal confirmation muncul
- [ ] Klik "Approve & Send Email"
- [ ] Verify success message
- [ ] Check email inbox untuk approval email
- [ ] Verify email berisi link reset password
- [ ] Check database:
  ```sql
  SELECT status, reset_token, reset_token_expires_at 
  FROM password_reset_requests 
  WHERE email = 'your-test-email@example.com' 
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Verify status = 'approved'
- [ ] Verify reset_token not null
- [ ] Verify reset_token_expires_at is 1 hour from now

### Test 3: Reset Password
- [ ] Open link dari email approval
- [ ] Verify redirect ke `/auth/reset-password?token=...`
- [ ] Verify form reset password muncul
- [ ] Masukkan password baru (min 8 chars)
- [ ] Masukkan konfirmasi password (sama)
- [ ] Submit form
- [ ] Verify success page muncul
- [ ] Verify auto-redirect ke login (3 detik)
- [ ] Check database:
  ```sql
  SELECT status, reset_token 
  FROM password_reset_requests 
  WHERE email = 'your-test-email@example.com' 
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Verify status = 'completed'
- [ ] Verify reset_token = null

### Test 4: Login with New Password
- [ ] Di halaman login, masukkan:
  - Email: (email yang baru reset)
  - Password: (password baru)
- [ ] Submit login
- [ ] Verify berhasil masuk dashboard
- [ ] Verify tidak ada error

### Test 5: Superadmin Rejection
- [ ] Create request baru (logout, forgot password, submit)
- [ ] Login sebagai superadmin
- [ ] Buka tab "Password Reset"
- [ ] Klik tombol "Reject" pada request baru
- [ ] Isi alasan penolakan: "Testing rejection flow"
- [ ] Klik "Reject & Send Email"
- [ ] Verify success message
- [ ] Check email inbox untuk rejection email
- [ ] Verify email berisi alasan penolakan
- [ ] Check database:
  ```sql
  SELECT status, rejection_reason 
  FROM password_reset_requests 
  WHERE email = 'your-test-email@example.com' 
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Verify status = 'rejected'
- [ ] Verify rejection_reason not null

### Test 6: Token Expiration
- [ ] Create request dan approve
- [ ] Manually update token expiration:
  ```sql
  UPDATE password_reset_requests 
  SET reset_token_expires_at = NOW() - INTERVAL '1 hour'
  WHERE email = 'your-test-email@example.com' 
  AND status = 'approved';
  ```
- [ ] Try to open reset link
- [ ] Verify error page "Token sudah kadaluarsa"
- [ ] Verify link "Request Reset Password Baru" works

### Test 7: Invalid Token
- [ ] Try to access `/auth/reset-password?token=invalid-token-123`
- [ ] Verify error page "Token tidak valid"
- [ ] Verify link "Request Reset Password Baru" works

### Test 8: Audit Logs
- [ ] Login sebagai superadmin
- [ ] Buka tab "Audit Logs"
- [ ] Filter by resource type: "PASSWORD_RESET_REQUEST"
- [ ] Verify approve actions logged
- [ ] Verify reject actions logged
- [ ] Verify details contain:
  - target_email
  - target_name
  - rejection_reason (for reject)

### Test 9: Filter Functionality
- [ ] Di tab "Password Reset"
- [ ] Klik filter "Pending"
- [ ] Verify hanya pending requests muncul
- [ ] Klik filter "Approved"
- [ ] Verify hanya approved requests muncul
- [ ] Klik filter "Rejected"
- [ ] Verify hanya rejected requests muncul

### Test 10: Refresh Functionality
- [ ] Di tab "Password Reset"
- [ ] Klik tombol "Refresh"
- [ ] Verify list ter-refresh
- [ ] Verify loading state muncul sebentar

---

## Security Checks

### Access Control
- [ ] Admin biasa (non-superadmin) tidak bisa akses tab "Password Reset"
- [ ] Tab "Password Reset" tidak muncul di sidebar untuk admin biasa
- [ ] API `/api/admin/password-reset-requests` return 403 untuk non-superadmin
- [ ] RLS policies enforce superadmin-only access

### Token Security
- [ ] Reset token adalah 64-character hex string
- [ ] Token unique (tidak ada duplicate)
- [ ] Token expires in 1 hour
- [ ] Token cleared after password reset
- [ ] Token cannot be reused

### Password Security
- [ ] Password minimum 8 characters enforced
- [ ] Password confirmation required
- [ ] Mismatch detection works
- [ ] Password stored securely (hashed by Supabase)

---

## Performance Checks

- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Email delivery time < 10 seconds
- [ ] No console errors
- [ ] No memory leaks

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Production Deployment

### 1. Update Environment Variables
```env
# Change to production URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Use production email
EMAIL_FROM=noreply@your-domain.com
```

### 2. Deploy to Vercel/Netlify
```bash
# Commit changes
git add .
git commit -m "feat: add password reset feature with approval system"
git push origin main

# Deploy will trigger automatically
```

### 3. Post-Deployment Verification
- [ ] Visit production URL
- [ ] Test complete flow on production
- [ ] Verify emails sent from production
- [ ] Check production database
- [ ] Monitor error logs

---

## Rollback Plan

If issues occur:

### 1. Disable Feature
```sql
-- Temporarily disable RLS to prevent access
ALTER TABLE password_reset_requests DISABLE ROW LEVEL SECURITY;
```

### 2. Revert Code
```bash
git revert HEAD
git push origin main
```

### 3. Drop Table (if needed)
```sql
DROP TABLE IF EXISTS password_reset_requests CASCADE;
```

---

## Monitoring

### Metrics to Track:
- [ ] Number of password reset requests per day
- [ ] Approval rate (approved / total requests)
- [ ] Average time to review (reviewed_at - created_at)
- [ ] Token expiration rate
- [ ] Failed reset attempts

### Queries:
```sql
-- Daily requests
SELECT DATE(created_at) as date, COUNT(*) as total
FROM password_reset_requests
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Approval rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM password_reset_requests
GROUP BY status;

-- Average review time
SELECT 
  AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) as avg_hours
FROM password_reset_requests
WHERE reviewed_at IS NOT NULL;
```

---

## Support Documentation

### For Users:
- [ ] Update user guide with password reset instructions
- [ ] Create FAQ section
- [ ] Add troubleshooting tips

### For Admins:
- [ ] Document approval process
- [ ] Create rejection reason guidelines
- [ ] Add escalation procedures

---

## ✅ Sign-Off

- [ ] All tests passed
- [ ] Security checks completed
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Team notified
- [ ] Ready for production

**Deployed by:** _________________  
**Date:** _________________  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 📞 Emergency Contacts

- **Developer:** [Your Name]
- **DevOps:** [DevOps Team]
- **Support:** [Support Email]

---

**Last Updated:** 2024  
**Next Review:** After 1 week in production
