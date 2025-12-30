-- =====================================================
-- RLS POLICIES FOR DEBTS TABLE
-- =====================================================
-- This file adds Row Level Security to the debts table
-- to ensure users can only access their own debt data.
--
-- IMPORTANT: Execute this in Supabase SQL Editor
-- =====================================================

-- Enable RLS on debts table
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own debts
CREATE POLICY "Users can read own debts"
  ON debts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own debts
CREATE POLICY "Users can insert own debts"
  ON debts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own debts
CREATE POLICY "Users can update own debts"
  ON debts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own debts
CREATE POLICY "Users can delete own debts"
  ON debts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verification query (run after applying policies)
-- This should only return YOUR debts
SELECT COUNT(*) as my_debts FROM debts;
