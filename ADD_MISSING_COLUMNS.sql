-- ============================================================
-- ADD MISSING COLUMNS (Simple & Safe)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add status column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
    RAISE NOTICE '✅ Column status added';
  ELSE
    RAISE NOTICE '✅ Column status already exists';
  END IF;
END $$;

-- Add last_login_at column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Column last_login_at added';
  ELSE
    RAISE NOTICE '✅ Column last_login_at already exists';
  END IF;
END $$;

-- Update existing users
UPDATE users 
SET status = 'active' 
WHERE is_active = true AND (status IS NULL OR status = '');

UPDATE users 
SET status = 'inactive' 
WHERE is_active = false AND (status IS NULL OR status = '');

-- Verify
SELECT 
  'Columns added successfully! ✅' as message,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN last_login_at IS NOT NULL THEN 1 END) as users_with_last_login
FROM users;
