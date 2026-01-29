-- =========================================
-- SECURITY FIX: Enable RLS on missing tables
-- =========================================
-- Tables concernées: users, fixed_charges, budgets
-- Run this in Supabase SQL Editor

-- =========================================
-- 1. TABLE: users
-- =========================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only access their own record
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Note: INSERT is typically handled by auth trigger, not direct insert
-- If users need to insert their own profile:
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =========================================
-- 2. TABLE: fixed_charges
-- =========================================

-- Enable RLS
ALTER TABLE fixed_charges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own fixed charges"
  ON fixed_charges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fixed charges"
  ON fixed_charges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fixed charges"
  ON fixed_charges
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fixed charges"
  ON fixed_charges
  FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- 3. TABLE: budgets
-- =========================================

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own budgets"
  ON budgets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets
  FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- VERIFICATION
-- =========================================
-- Run this query to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
