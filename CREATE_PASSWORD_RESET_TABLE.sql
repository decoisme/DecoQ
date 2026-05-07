-- ============================================
-- PASSWORD RESET REQUESTS TABLE
-- ============================================
-- Table untuk menyimpan request reset password dari admin
-- Superadmin bisa approve atau reject request

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  reset_token TEXT UNIQUE,
  reset_token_expires_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_email ON password_reset_requests(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_reset_token ON password_reset_requests(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_created_at ON password_reset_requests(created_at DESC);

-- RLS Policies
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Superadmin can view all requests
CREATE POLICY "Superadmin can view all password reset requests"
  ON password_reset_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'superadmin'
      AND users.is_active = true
    )
  );

-- Superadmin can update requests (approve/reject)
CREATE POLICY "Superadmin can update password reset requests"
  ON password_reset_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'superadmin'
      AND users.is_active = true
    )
  );

-- Anyone can insert (create request) - will be validated in API
CREATE POLICY "Anyone can create password reset request"
  ON password_reset_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE password_reset_requests IS 'Stores password reset requests from admins that need superadmin approval';
COMMENT ON COLUMN password_reset_requests.status IS 'Request status: pending, approved, rejected, completed';
COMMENT ON COLUMN password_reset_requests.reset_token IS 'Secure token for password reset (only set when approved)';
COMMENT ON COLUMN password_reset_requests.reviewed_by IS 'Superadmin who reviewed the request';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'password_reset_requests'
ORDER BY ordinal_position;
