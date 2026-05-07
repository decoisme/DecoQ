-- ============================================
-- ENHANCE AUDIT LOGS TABLE
-- ============================================
-- Add user_id column to track which user performed the action
-- This allows better tracking and filtering of audit logs

-- Add user_id column (nullable for backward compatibility)
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Add comment
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action (from users table)';

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if column was added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;
