-- ============================================
-- DEBUG INVITATION TOKEN ISSUE
-- ============================================
-- Run these queries to debug why invitation doesn't work on other devices

-- 1. Check if invitation_token column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('invitation_token', 'invitation_expires_at', 'status');

-- 2. Check all pending invitations
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  is_active,
  auth_user_id,
  invitation_token,
  invitation_expires_at,
  created_at,
  invited_at
FROM users
WHERE status = 'pending' OR (is_active = false AND auth_user_id IS NOT NULL)
ORDER BY created_at DESC;

-- 3. Check if token exists for specific email
-- Replace 'email@example.com' with actual email
SELECT 
  id,
  email,
  invitation_token,
  invitation_expires_at,
  status,
  auth_user_id,
  CASE 
    WHEN invitation_expires_at IS NULL THEN 'No expiration set'
    WHEN invitation_expires_at > NOW() THEN 'Valid (not expired)'
    ELSE 'EXPIRED'
  END as token_status
FROM users
WHERE email = 'muhdinanghifari@gmail.com';  -- Change this email

-- 4. Check all users with auth_user_id but not active
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  is_active,
  auth_user_id,
  invitation_token IS NOT NULL as has_token,
  invitation_expires_at,
  created_at
FROM users
WHERE auth_user_id IS NOT NULL 
AND is_active = false
ORDER BY created_at DESC;

-- 5. Fix: Add invitation_token and status columns if missing
-- Run this if columns don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 6. Fix: Update existing pending users to have proper status
UPDATE users
SET status = 'pending'
WHERE auth_user_id IS NOT NULL 
AND is_active = false 
AND last_login_at IS NULL
AND (status IS NULL OR status = 'active');

-- 7. Check Supabase Auth users vs database users
-- This helps identify orphaned auth users
SELECT 
  u.email,
  u.status,
  u.is_active,
  u.auth_user_id,
  u.invitation_token IS NOT NULL as has_token,
  u.invitation_expires_at
FROM users u
WHERE u.auth_user_id IS NOT NULL
ORDER BY u.created_at DESC;

-- ============================================
-- SOLUTION: Regenerate invitation token
-- ============================================
-- If token is missing or expired, run this to regenerate
-- Replace email and generate new token

-- Step 1: Generate new token (use this in your app or generate manually)
-- In Node.js: crypto.randomBytes(32).toString('hex')

-- Step 2: Update user with new token
UPDATE users
SET 
  invitation_token = 'NEW_TOKEN_HERE',  -- Replace with actual token
  invitation_expires_at = NOW() + INTERVAL '7 days',
  status = 'pending',
  updated_at = NOW()
WHERE email = 'muhdinanghifari@gmail.com';  -- Replace with actual email

-- Step 3: Verify update
SELECT 
  email,
  invitation_token,
  invitation_expires_at,
  status,
  invitation_expires_at > NOW() as is_valid
FROM users
WHERE email = 'muhdinanghifari@gmail.com';

-- ============================================
-- ALTERNATIVE: Check if using old base64 method
-- ============================================
-- If your invite API is using old base64url encoding instead of secure token

-- Check invite API code - should use:
-- const token = crypto.randomBytes(32).toString('hex')
-- NOT: Buffer.from(JSON.stringify({...})).toString('base64url')

-- ============================================
-- COMMON ISSUES & FIXES
-- ============================================

-- Issue 1: Token column doesn't exist
-- Fix: Run ALTER TABLE above (step 5)

-- Issue 2: Token is NULL
-- Fix: Resend invitation or manually update token (step 2)

-- Issue 3: Token expired
-- Fix: Update expiration date
UPDATE users
SET invitation_expires_at = NOW() + INTERVAL '7 days'
WHERE email = 'muhdinanghifari@gmail.com';

-- Issue 4: Auth user exists but no database record
-- Fix: This shouldn't happen with new flow, but if it does:
-- Delete auth user and resend invitation

-- Issue 5: Multiple users with same email
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- If duplicates exist, keep the latest one:
-- DELETE FROM users 
-- WHERE id NOT IN (
--   SELECT MAX(id) FROM users GROUP BY email
-- );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- After fixing, verify everything works:

-- 1. Check token is valid
SELECT 
  email,
  invitation_token,
  invitation_expires_at > NOW() as is_valid,
  status,
  auth_user_id IS NOT NULL as has_auth_user
FROM users
WHERE email = 'muhdinanghifari@gmail.com';

-- 2. Test the full flow
-- - Resend invitation
-- - Check email received
-- - Click link
-- - Should show setup form

-- ============================================
-- MONITORING QUERY
-- ============================================
-- Use this to monitor invitation status

SELECT 
  email,
  full_name,
  role,
  status,
  CASE 
    WHEN invitation_token IS NULL THEN '❌ No token'
    WHEN invitation_expires_at IS NULL THEN '⚠️ No expiration'
    WHEN invitation_expires_at < NOW() THEN '⏰ Expired'
    ELSE '✅ Valid'
  END as token_status,
  invitation_expires_at,
  created_at,
  invited_at
FROM users
WHERE status = 'pending'
ORDER BY created_at DESC;
