-- Schema for budgets table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL CHECK (period IN ('MONTHLY', 'ROLLING', 'MULTI')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT: Users can read only their own budgets
CREATE POLICY "Users can read own budgets"
  ON budgets
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can insert only with their own user_id
CREATE POLICY "Users can insert own budgets"
  ON budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE/DELETE: Denied for now (read-only after creation)
-- No policies = no access

-- Indexes for performance
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets(user_id);
CREATE INDEX IF NOT EXISTS budgets_category_idx ON budgets(category);
CREATE INDEX IF NOT EXISTS budgets_period_idx ON budgets(period);

