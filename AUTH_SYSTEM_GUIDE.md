# 🔐 Email-Based Auth System Guide - DecoQ

## 📋 Overview

Sistem autentikasi berbasis email dengan Supabase Auth untuk manage admin. Menggantikan sistem admin key dengan user authentication yang lebih aman dan scalable.

---

## 🎯 Features

### ✅ **Authentication**
- Email + Password login via Supabase Auth
- Email invite system untuk onboarding admin baru
- Magic link support (optional)
- Session management dengan JWT
- Auto-logout on inactive account

### ✅ **Role-Based Access Control**
- **Superadmin**: Full access - manage admin, QRIS, logs
- **Admin**: View only - lihat data, tidak bisa edit/delete

### ✅ **Admin Management** (Superadmin Only)
- Invite admin via email
- List all users dengan filter & search
- Delete user (revoke access)
- Change role (promote/demote)
- View user statistics

### ✅ **Security**
- Row Level Security (RLS) di Supabase
- Middleware untuk protect routes
- Audit logging untuk semua auth actions
- Cannot delete self
- Cannot change own role

### ✅ **Audit Trail**
- Login/Logout tracking
- Invite sent/accepted
- Role changes
- User deletions
- IP address & user agent logging

---

## 🗄️ Database Schema

### **Tables Created:**

#### 1. `users`
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- role (TEXT: 'admin' | 'superadmin')
- full_name (TEXT, nullable)
- auth_user_id (UUID, FK to auth.users)
- invited_by (UUID, FK to users)
- invited_at (TIMESTAMPTZ)
- last_login_at (TIMESTAMPTZ)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 2. `auth_logs`
```sql
- id (UUID, PK)
- user_id (UUID, FK to users)
- email (TEXT)
- action (TEXT: LOGIN, LOGOUT, INVITE_SENT, etc.)
- role (TEXT)
- details (JSONB)
- ip_address (TEXT)
- user_agent (TEXT)
- created_at (TIMESTAMPTZ)
```

#### 3. `users_stats` (View)
```sql
- total_superadmins
- total_admins
- total_active_users
- total_inactive_users
- total_users
```

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

**IMPORTANT**: Gunakan file `supabase-auth-migration-safe.sql` (bukan yang lama)

1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste **SELURUH ISI** file `supabase-auth-migration-safe.sql`
3. Klik **Run**
4. Tunggu sampai selesai (akan ada output verification)
5. Check output untuk memastikan semua berhasil:
   ```
   ✓ users table exists
   ✓ auth_logs table exists
   ✓ users_stats view exists
   ```

**Troubleshooting:**
- Jika ada error "column does not exist", pastikan Anda run SELURUH script sekaligus
- Jika ada error "policy already exists", script akan skip otomatis (aman)
- Jika ada error lain, screenshot dan check di bagian Troubleshooting

6. Verify tables created:
   ```sql
   -- Check tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('users', 'auth_logs');
   
   -- Check view
   SELECT * FROM users_stats;
   
   -- Should return: 0 for all counts (no users yet)
   ```

### **Step 2: Create First Superadmin**

**Option A: Via Supabase Dashboard (Recommended)**

1. Buka **Authentication → Users**
2. Klik **Invite User** atau **Add User**
3. Masukkan email superadmin (contoh: `superadmin@decoq.com`)
4. User akan menerima email invite
5. Klik link di email → Set password
6. Setelah signup, jalankan query ini di SQL Editor:

```sql
-- Update user menjadi superadmin
UPDATE users
SET role = 'superadmin', is_active = TRUE
WHERE email = 'superadmin@decoq.com';
```

**Option B: Manual Insert**

```sql
-- 1. Create auth user via Supabase Dashboard first
-- 2. Get auth_user_id from Authentication → Users
-- 3. Insert ke users table:

INSERT INTO users (email, role, full_name, auth_user_id, is_active)
VALUES (
  'superadmin@decoq.com',
  'superadmin',
  'Super Admin',
  'AUTH_USER_ID_DARI_DASHBOARD', -- Ganti dengan ID dari auth.users
  TRUE
);
```

### **Step 3: Configure Supabase Auth**

1. Buka **Authentication → URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (dev) atau `https://yourdomain.com` (prod)
3. Set **Redirect URLs**: 
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

4. Buka **Authentication → Email Templates**
5. Customize **Invite User** template (optional):
   ```html
   <h2>You've been invited to DecoQ Admin</h2>
   <p>Click the link below to set your password and activate your account:</p>
   <p><a href="{{ .ConfirmationURL }}">Accept Invite</a></p>
   ```

### **Step 4: Update Environment Variables**

Add to `.env.local`:

```env
# Existing Supabase vars
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site URL for redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Keep old admin keys for backward compatibility
# ADMIN_KEY=admin123
# SUPERADMIN_KEY=superadmin123
```

### **Step 5: Install Dependencies**

```bash
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
```

### **Step 6: Test the System**

1. **Login as Superadmin**:
   ```
   http://localhost:3000/auth/login
   Email: superadmin@decoq.com
   Password: (yang Anda set saat invite)
   ```

2. **Access Manage Admin**:
   ```
   http://localhost:3000/manage-admin
   ```

3. **Invite New Admin**:
   - Klik "Invite Admin"
   - Masukkan email
   - Pilih role (admin/superadmin)
   - Klik "Send Invite"
   - User akan menerima email

4. **Accept Invite** (as new user):
   - Buka email
   - Klik link invite
   - Set password
   - Auto-redirect ke dashboard

---

## 📁 File Structure

```
pages/
├── auth/
│   ├── login.tsx              # Login page
│   └── callback.tsx           # Auth callback handler
├── manage-admin.tsx           # Admin management page (superadmin only)
└── api/
    └── admin/
        ├── invite.ts          # POST - Invite new admin
        ├── list-users.ts      # GET - List all users
        ├── delete-user.ts     # DELETE - Remove user
        └── update-role.ts     # PATCH - Change user role

supabase-auth-migration.sql    # Database migration script
AUTH_SYSTEM_GUIDE.md           # This file
```

---

## 🔐 API Endpoints

### **1. POST `/api/admin/invite`**

Invite new admin via email.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "newadmin@example.com",
  "role": "admin",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invite berhasil dikirim ke newadmin@example.com",
  "user": {
    "id": "uuid",
    "email": "newadmin@example.com",
    "role": "admin",
    "invited_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400`: Email invalid atau sudah terdaftar
- `401`: Unauthorized (no token)
- `403`: Forbidden (bukan superadmin)
- `500`: Server error

---

### **2. GET `/api/admin/list-users`**

Get list of all users.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Params:**
- `role`: Filter by role (admin/superadmin)
- `is_active`: Filter by status (true/false)
- `search`: Search by email or name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "admin",
      "full_name": "John Doe",
      "is_active": true,
      "invited_at": "2024-01-01T00:00:00Z",
      "last_login_at": "2024-01-02T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "invited_by": {
        "email": "superadmin@example.com",
        "full_name": "Super Admin"
      }
    }
  ],
  "stats": {
    "total_superadmins": 1,
    "total_admins": 5,
    "total_active_users": 6,
    "total_inactive_users": 0,
    "total_users": 6
  }
}
```

---

### **3. DELETE `/api/admin/delete-user`**

Delete user and revoke access.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User admin@example.com berhasil dihapus"
}
```

**Errors:**
- `400`: Cannot delete self
- `403`: Forbidden (bukan superadmin)
- `404`: User not found

---

### **4. PATCH `/api/admin/update-role`**

Change user role.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "uuid",
  "newRole": "superadmin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role admin@example.com berhasil diubah dari admin ke superadmin",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "superadmin"
  }
}
```

**Errors:**
- `400`: Cannot change own role
- `403`: Forbidden (bukan superadmin)
- `404`: User not found

---

## 🔒 Security Features

### **Row Level Security (RLS)**

All tables have RLS enabled with policies:

**users table:**
- Superadmin can read/insert/update/delete all users
- Users can read/update own data (limited fields)
- Cannot delete self
- Cannot change own role

**auth_logs table:**
- Authenticated users can read logs
- Anyone can insert logs (for logging purposes)

### **Middleware Protection**

Add to `middleware.ts` (optional):

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect /manage-admin route
  if (req.nextUrl.pathname.startsWith('/manage-admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Check if superadmin
    const { data: user } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user || user.role !== 'superadmin' || !user.is_active) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/manage-admin/:path*']
}
```

---

## 📊 Audit Logging

All auth actions are logged to `auth_logs` table:

| Action | Description |
|--------|-------------|
| `LOGIN` | User logged in |
| `LOGOUT` | User logged out |
| `INVITE_SENT` | Admin invite sent |
| `INVITE_ACCEPTED` | User accepted invite |
| `PASSWORD_RESET` | Password reset requested |
| `ROLE_CHANGED` | User role changed |
| `USER_DELETED` | User deleted |
| `USER_REACTIVATED` | Inactive user reactivated |

**View logs:**
```sql
SELECT 
  email,
  action,
  role,
  details,
  created_at
FROM auth_logs
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🔄 Migration from Admin Key System

### **Parallel Running (Recommended)**

1. Keep old admin key system active
2. Deploy new auth system
3. Invite all admins via email
4. Test thoroughly
5. Remove admin key system after migration complete

### **Update Existing APIs**

Add auth check to existing API routes:

```typescript
// Old way
const adminKey = req.headers['x-admin-key']
if (adminKey !== process.env.SUPERADMIN_KEY) {
  return res.status(403).json({ error: 'Forbidden' })
}

// New way (add alongside old)
const authHeader = req.headers.authorization
if (authHeader) {
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  
  if (user) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .single()
    
    if (userData?.role === 'superadmin' && userData.is_active) {
      // Authorized via new system
      // ... proceed
    }
  }
}
```

---

## 🐛 Troubleshooting

### **Issue: "column role does not exist" error**

**Cause:** View `users_stats` dibuat sebelum table `users`

**Solution:**
```sql
-- Drop and recreate view
DROP VIEW IF EXISTS users_stats;

CREATE VIEW users_stats AS
SELECT
  COUNT(*) FILTER (WHERE users.role = 'superadmin' AND users.is_active = TRUE) as total_superadmins,
  COUNT(*) FILTER (WHERE users.role = 'admin' AND users.is_active = TRUE) as total_admins,
  COUNT(*) FILTER (WHERE users.is_active = TRUE) as total_active_users,
  COUNT(*) FILTER (WHERE users.is_active = FALSE) as total_inactive_users,
  COUNT(*) as total_users
FROM users;

-- Grant access
GRANT SELECT ON users_stats TO authenticated, anon;

-- Test
SELECT * FROM users_stats;
```

**Prevention:** Gunakan `supabase-auth-migration-safe.sql` yang sudah diperbaiki

### **Issue: Email invite tidak terkirim**

**Solution:**
1. Check Supabase Dashboard → Authentication → Email Templates
2. Verify SMTP settings (if using custom SMTP)
3. Check spam folder
4. Test with different email provider

### **Issue: User tidak bisa login setelah accept invite**

**Solution:**
```sql
-- Check if user exists in users table
SELECT * FROM users WHERE email = 'user@example.com';

-- Check if auth_user_id is set
SELECT auth_user_id FROM users WHERE email = 'user@example.com';

-- Check if user is active
SELECT is_active FROM users WHERE email = 'user@example.com';

-- Manually activate if needed
UPDATE users SET is_active = TRUE WHERE email = 'user@example.com';
```

### **Issue: RLS blocking queries**

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### **Issue: Cannot delete user**

**Solution:**
- Check if trying to delete self (not allowed)
- Check if user is superadmin (need proper permissions)
- Check cascade constraints

---

## 📚 Best Practices

### **Security**
1. ✅ Always use HTTPS in production
2. ✅ Rotate service role key regularly
3. ✅ Monitor auth_logs for suspicious activity
4. ✅ Implement rate limiting on auth endpoints
5. ✅ Use strong password requirements

### **User Management**
1. ✅ Deactivate users instead of deleting (soft delete)
2. ✅ Regular audit of user access
3. ✅ Remove inactive users after 90 days
4. ✅ Require password change every 90 days
5. ✅ Implement 2FA (future enhancement)

### **Development**
1. ✅ Test invite flow thoroughly
2. ✅ Handle all error cases
3. ✅ Log all important actions
4. ✅ Use TypeScript for type safety
5. ✅ Write integration tests

---

## 🔮 Future Enhancements

- [ ] Two-Factor Authentication (2FA)
- [ ] Password strength requirements
- [ ] Account lockout after failed attempts
- [ ] Email verification for new signups
- [ ] Social login (Google, GitHub)
- [ ] User profile management
- [ ] Activity dashboard per user
- [ ] Bulk user import/export
- [ ] Custom email templates
- [ ] Webhook notifications

---

## 📞 Support

**Issues?**
1. Check this guide
2. Check Supabase logs
3. Check browser console
4. Check Network tab for API errors

**Common Errors:**
- `401 Unauthorized` → Check token validity
- `403 Forbidden` → Check user role
- `404 Not Found` → Check user exists in database
- `500 Server Error` → Check Supabase logs

---

**Happy Managing! 🎉**
