-- ============================================
-- FIX INVITATION TOKEN ISSUE
-- ============================================

-- Step 1: Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('invitation_token', 'invitation_expires_at', 'status');

-- Step 2: Add columns if missing
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Step 3: Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);

-- Step 4: Check current pending users
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  is_active,
  auth_user_id IS NOT NULL as has_auth,
  invitation_token,
  invitation_expires_at,
  created_at
FROM users
WHERE is_active = false OR status = 'pending'
ORDER BY created_at DESC;

-- Step 5: If user exists but no token, you need to RESEND invitation
-- Delete old user and resend from dashboard
-- Example:
-- DELETE FROM users WHERE email = 'muhdinanghifari@gmail.com';

-- Step 6: After resend, verify token is stored
SELECT 
  email,
  invitation_token IS NOT NULL as has_token,
  LENGTH(invitation_token) as token_length,
  invitation_expires_at,
  invitation_expires_at > NOW() as is_valid,
  status
FROM users
WHERE email = 'muhdinanghifari@gmail.com';  -- Replace with actual email

-- Expected result:
-- has_token: true
-- token_length: 64 (32 bytes hex = 64 characters)
-- is_valid: true
-- status: pending

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If token is NULL after invite:
-- 1. Check API logs for errors
-- 2. Verify columns exist (run Step 2 above)
-- 3. Delete user and resend invitation

-- If token exists but still error:
-- 1. Check token in URL matches token in database
-- 2. Check expiration date
-- 3. Check RLS policies

-- Check RLS policies for users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';

-- If RLS is blocking, temporarily disable for testing:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- (Remember to re-enable after testing!)

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this after resending invitation to verify everything is correct
SELECT 
  email,
  role,
  status,
  is_active,
  auth_user_id IS NOT NULL as has_auth_user,
  invitation_token IS NOT NULL as has_token,
  LENGTH(invitation_token) as token_length,
  invitation_expires_at,
  invitation_expires_at > NOW() as token_valid,
  EXTRACT(EPOCH FROM (invitation_expires_at - NOW())) / 3600 as hours_until_expiry,
  created_at,
  invited_at
FROM users
WHERE email = 'muhdinanghifari@gmail.com'  -- Replace with actual email
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- QUICK FIX: Manual Token Generation
-- ============================================

-- If you need to manually add token to existing user:
-- (Use this only if resend doesn't work)

-- Generate token in Node.js:
-- const crypto = require('crypto');
-- const token = crypto.randomBytes(32).toString('hex');
-- console.log(token);

-- Then update user:
UPDATE users
SET 
  invitation_token = 'PASTE_GENERATED_TOKEN_HERE',  -- 64-char hex string
  invitation_expires_at = NOW() + INTERVAL '7 days',
  status = 'pending',
  updated_at = NOW()
WHERE email = 'muhdinanghifari@gmail.com';  -- Replace with actual email

-- Verify update:
SELECT 
  email,
  invitation_token,
  invitation_expires_at,
  status
FROM users
WHERE email = 'muhdinanghifari@gmail.com';
