-- =====================================================
-- RLS POLICIES FOR BUDGET_RECURRING_CHARGES TABLE
-- =====================================================
-- This file adds Row Level Security to the junction table
-- that links budgets to recurring charges.
--
-- SECURITY APPROACH:
-- Instead of adding user_id to this junction table, we verify
-- ownership through the related budgets and recurring_charges tables.
-- A user can only access links where BOTH the budget AND the charge
-- belong to them.
--
-- IMPORTANT: Execute this in Supabase SQL Editor
-- =====================================================

-- Enable RLS on budget_recurring_charges table
ALTER TABLE budget_recurring_charges ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read links for their own budgets and charges
-- This uses a subquery to verify both budget and charge ownership
CREATE POLICY "Users can read own budget-charge links"
  ON budget_recurring_charges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_recurring_charges.budget_id
      AND budgets.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM recurring_charges
      WHERE recurring_charges.id = budget_recurring_charges.recurring_charge_id
      AND recurring_charges.user_id = auth.uid()
    )
  );

-- Policy 2: Users can insert links for their own budgets and charges
CREATE POLICY "Users can insert own budget-charge links"
  ON budget_recurring_charges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_recurring_charges.budget_id
      AND budgets.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM recurring_charges
      WHERE recurring_charges.id = budget_recurring_charges.recurring_charge_id
      AND recurring_charges.user_id = auth.uid()
    )
  );

-- Policy 3: Users can update links for their own budgets and charges
CREATE POLICY "Users can update own budget-charge links"
  ON budget_recurring_charges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_recurring_charges.budget_id
      AND budgets.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM recurring_charges
      WHERE recurring_charges.id = budget_recurring_charges.recurring_charge_id
      AND recurring_charges.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_recurring_charges.budget_id
      AND budgets.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM recurring_charges
      WHERE recurring_charges.id = budget_recurring_charges.recurring_charge_id
      AND recurring_charges.user_id = auth.uid()
    )
  );

-- Policy 4: Users can delete links for their own budgets and charges
CREATE POLICY "Users can delete own budget-charge links"
  ON budget_recurring_charges
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_recurring_charges.budget_id
      AND budgets.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM recurring_charges
      WHERE recurring_charges.id = budget_recurring_charges.recurring_charge_id
      AND recurring_charges.user_id = auth.uid()
    )
  );

-- Verification query (run after applying policies)
-- This should only return YOUR budget-charge links
SELECT COUNT(*) as my_links FROM budget_recurring_charges;

-- Performance note: These policies use subqueries which may be slower
-- than direct user_id checks. Consider adding indexes on:
-- - budgets(id, user_id)
-- - recurring_charges(id, user_id)
-- These indexes likely already exist from other optimizations.
