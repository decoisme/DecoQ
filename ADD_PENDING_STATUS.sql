-- ============================================================
-- ADD PENDING STATUS FOR INVITED USERS
-- Safe migration that checks if columns exist first
-- ============================================================

-- Add status column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN status TEXT DEFAULT 'active' 
    CHECK (status IN ('pending', 'active', 'inactive'));
    
    RAISE NOTICE '✓ Column status added';
  ELSE
    RAISE NOTICE '✓ Column status already exists';
  END IF;
END $$;

-- Add invitation_token column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'invitation_token'
  ) THEN
    ALTER TABLE users ADD COLUMN invitation_token TEXT;
    RAISE NOTICE '✓ Column invitation_token added';
  ELSE
    RAISE NOTICE '✓ Column invitation_token already exists';
  END IF;
END $$;

-- Add invitation_expires_at column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'invitation_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN invitation_expires_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✓ Column invitation_expires_at added';
  ELSE
    RAISE NOTICE '✓ Column invitation_expires_at already exists';
  END IF;
END $$;

-- Update existing users to 'active' status
UPDATE users 
SET status = 'active' 
WHERE status IS NULL AND is_active = true;

-- Update existing inactive users
UPDATE users 
SET status = 'inactive' 
WHERE status IS NULL AND is_active = false;

-- Create indexes for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);

-- Verify changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('status', 'invitation_token', 'invitation_expires_at')
ORDER BY column_name;

-- Show current users with new status
SELECT 
  email,
  role,
  COALESCE(status, 'N/A') as status,
  is_active,
  invited_at,
  invitation_expires_at
FROM users
ORDER BY invited_at DESC;
