-- =====================================================
-- AUDIT LOGS TABLE SCHEMA
-- =====================================================
-- This table tracks all important user actions for security
-- and compliance purposes (RGPD, SOC 2, etc.)
--
-- IMPORTANT: Execute this in Supabase SQL Editor
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- e.g., 'transaction.create', 'budget.delete'
  resource_type VARCHAR(50) NOT NULL, -- e.g., 'transaction', 'budget', 'debt'
  resource_id UUID, -- ID of the affected resource
  details JSONB, -- Additional context (old values, new values, etc.)
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT, -- Browser/client information
  status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success', 'failed', 'denied'
  error_message TEXT, -- If status = 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Composite index for common filter combinations
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own audit logs
CREATE POLICY "Users can read own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert audit logs (service role only)
-- Note: Individual users should NOT be able to insert/modify logs
-- Only the application (via service role) should write logs
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL); -- Requires authenticated context

-- Policy: Prevent users from modifying/deleting logs
-- (No UPDATE/DELETE policies = denied to regular users)

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail of all user actions for security and compliance';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., transaction.create, budget.delete)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (transaction, budget, debt, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'UUID of the affected resource';
COMMENT ON COLUMN audit_logs.details IS 'JSON object with action-specific context';
COMMENT ON COLUMN audit_logs.status IS 'Outcome: success, failed, or denied';

-- Optional: Add retention policy (auto-delete logs older than 1 year)
-- Uncomment if you want automatic cleanup:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'audit-logs-cleanup',
--   '0 2 * * 0', -- Every Sunday at 2 AM
--   $$DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year'$$
-- );

-- Verification query
SELECT COUNT(*) as total_audit_logs FROM audit_logs;
