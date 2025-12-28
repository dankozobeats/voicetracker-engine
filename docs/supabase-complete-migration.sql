-- =========================================
-- MIGRATION COMPLÈTE: Engine Integration
-- =========================================
-- This script adds all missing fields and tables required by the production Engine
-- Run this in Supabase SQL Editor

-- =========================================
-- 1. UPDATE TRANSACTIONS TABLE
-- =========================================

-- Add missing columns to support Engine features
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS account TEXT NOT NULL DEFAULT 'SG' CHECK (account IN ('SG', 'FLOA')),
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'EXPENSE' CHECK (type IN ('INCOME', 'EXPENSE')),
ADD COLUMN IF NOT EXISTS is_deferred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deferred_to TEXT, -- YYYY-MM format
ADD COLUMN IF NOT EXISTS deferred_until TEXT, -- YYYY-MM format
ADD COLUMN IF NOT EXISTS max_deferral_months INTEGER,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 9;

-- Migrate existing data: detect type from label
UPDATE transactions
SET type = CASE
  WHEN LOWER(label) LIKE '%revenu%' OR LOWER(label) LIKE '%income%' OR LOWER(label) = 'revenu' THEN 'INCOME'
  ELSE 'EXPENSE'
END
WHERE type = 'EXPENSE'; -- Only update if still default

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS transactions_account_idx ON transactions(account);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);
CREATE INDEX IF NOT EXISTS transactions_is_deferred_idx ON transactions(is_deferred);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date);

-- =========================================
-- 2. CREATE RECURRING_CHARGES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS recurring_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account TEXT NOT NULL CHECK (account IN ('SG', 'FLOA')),
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  start_month TEXT NOT NULL, -- YYYY-MM format
  end_month TEXT, -- YYYY-MM format, NULL = indefinite
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE recurring_charges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own recurring charges"
  ON recurring_charges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring charges"
  ON recurring_charges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring charges"
  ON recurring_charges
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring charges"
  ON recurring_charges
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS recurring_charges_user_id_idx ON recurring_charges(user_id);
CREATE INDEX IF NOT EXISTS recurring_charges_account_idx ON recurring_charges(account);
CREATE INDEX IF NOT EXISTS recurring_charges_start_month_idx ON recurring_charges(start_month);

-- =========================================
-- 3. CREATE CEILING_RULES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS ceiling_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account TEXT NOT NULL CHECK (account IN ('SG', 'FLOA')),
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  start_month TEXT NOT NULL, -- YYYY-MM format
  end_month TEXT, -- YYYY-MM format, NULL = indefinite
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ceiling_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own ceiling rules"
  ON ceiling_rules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ceiling rules"
  ON ceiling_rules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ceiling rules"
  ON ceiling_rules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ceiling rules"
  ON ceiling_rules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS ceiling_rules_user_id_idx ON ceiling_rules(user_id);
CREATE INDEX IF NOT EXISTS ceiling_rules_account_idx ON ceiling_rules(account);
CREATE INDEX IF NOT EXISTS ceiling_rules_start_month_idx ON ceiling_rules(start_month);

-- =========================================
-- 4. UPDATE BUDGETS TABLE
-- =========================================

-- Add fields for rolling and multi-month budgets
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS window_months INTEGER, -- For rolling budgets (e.g., 3 for last 3 months)
ADD COLUMN IF NOT EXISTS period_start TEXT, -- YYYY-MM for multi-month
ADD COLUMN IF NOT EXISTS period_end TEXT; -- YYYY-MM for multi-month

-- Update period types
ALTER TABLE budgets
DROP CONSTRAINT IF EXISTS budgets_period_check;

ALTER TABLE budgets
ADD CONSTRAINT budgets_period_check CHECK (period IN ('MONTHLY', 'ROLLING', 'MULTI'));

-- Add validation: ROLLING budgets need window_months
ALTER TABLE budgets
ADD CONSTRAINT budgets_rolling_check CHECK (
  (period = 'ROLLING' AND window_months IS NOT NULL AND window_months > 0) OR
  (period != 'ROLLING')
);

-- Add validation: MULTI budgets need period_start and period_end
ALTER TABLE budgets
ADD CONSTRAINT budgets_multi_check CHECK (
  (period = 'MULTI' AND period_start IS NOT NULL AND period_end IS NOT NULL) OR
  (period != 'MULTI')
);

-- =========================================
-- 5. CREATE ACCOUNT_BALANCES TABLE
-- =========================================
-- To track opening balances for each account

CREATE TABLE IF NOT EXISTS account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account TEXT NOT NULL CHECK (account IN ('SG', 'FLOA')),
  month TEXT NOT NULL, -- YYYY-MM format
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, account, month)
);

-- Enable RLS
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own account balances"
  ON account_balances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account balances"
  ON account_balances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account balances"
  ON account_balances
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own account balances"
  ON account_balances
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS account_balances_user_id_idx ON account_balances(user_id);
CREATE INDEX IF NOT EXISTS account_balances_account_idx ON account_balances(account);
CREATE INDEX IF NOT EXISTS account_balances_month_idx ON account_balances(month);

-- =========================================
-- 6. SUMMARY
-- =========================================

-- Tables created/updated:
-- ✅ transactions - Added: account, type, is_deferred, deferred_to, deferred_until, max_deferral_months, priority
-- ✅ recurring_charges - NEW table for fixed monthly charges
-- ✅ ceiling_rules - NEW table for spending caps
-- ✅ budgets - Added: window_months, period_start, period_end
-- ✅ account_balances - NEW table for opening balances by account/month

-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Update TypeScript types to match new schema
-- 3. Create API endpoints for new tables
-- 4. Wire Engine to use real database data
-- 5. Update UI forms to support new fields
