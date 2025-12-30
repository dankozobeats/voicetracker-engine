-- =====================================================
-- RLS POLICIES FOR TRANSACTIONS TABLE
-- =====================================================
-- This file adds Row Level Security to the transactions table
-- to ensure users can only access their own transaction data.
--
-- IMPORTANT: Execute this in Supabase SQL Editor
-- =====================================================

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own transactions
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verification query (run after applying policies)
-- This should only return YOUR transactions
SELECT COUNT(*) as my_transactions FROM transactions;

-- Test isolation (should return 0 if RLS is working)
-- Try to access with a different user_id
-- SELECT * FROM transactions WHERE user_id != auth.uid(); -- Should fail or return 0
