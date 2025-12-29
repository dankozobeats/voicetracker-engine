-- Migration: Add budget link to transactions table
-- This allows transactions to be linked to budgets for tracking

-- Add budget_id column to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS transactions_budget_id_idx ON transactions(budget_id);

-- Add comment
COMMENT ON COLUMN transactions.budget_id IS 'Optional link to a budget for tracking expenses against budgets';
