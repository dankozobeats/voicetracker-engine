-- =====================================================
-- RLS POLICIES FOR CREDITS TABLE
-- =====================================================
-- This file adds Row Level Security to the credits table
-- to ensure users can only access their own credit data.
--
-- IMPORTANT: Execute this in Supabase SQL Editor
-- =====================================================

-- Enable RLS on credits table
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own credits
CREATE POLICY "Users can read own credits"
  ON credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own credits
CREATE POLICY "Users can insert own credits"
  ON credits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own credits
CREATE POLICY "Users can update own credits"
  ON credits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own credits
CREATE POLICY "Users can delete own credits"
  ON credits
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verification query (run after applying policies)
-- This should only return YOUR credits
SELECT COUNT(*) as my_credits FROM credits;
