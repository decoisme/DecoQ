-- ============================================================
-- ADD PENDING STATUS FOR INVITED USERS
-- ============================================================

-- Add status column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('pending', 'active', 'inactive'));

-- Add invitation_token column for secure token storage
ALTER TABLE users
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing users to 'active' status
UPDATE users 
SET status = 'active' 
WHERE status IS NULL AND is_active = true;

-- Update existing inactive users
UPDATE users 
SET status = 'inactive' 
WHERE status IS NULL AND is_active = false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);

-- Verify changes
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('status', 'invitation_token', 'invitation_expires_at');

-- Show current users with new status
SELECT 
  email,
  role,
  status,
  is_active,
  invited_at,
  invitation_expires_at
FROM users
ORDER BY invited_at DESC;
