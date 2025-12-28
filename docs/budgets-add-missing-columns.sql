-- Migration: Add missing columns to budgets table
-- This allows support for ROLLING and MULTI budgets

-- Add window_months for ROLLING budgets (e.g., "600€ over 3 months")
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS window_months INTEGER;

-- Add period_start and period_end for MULTI budgets (e.g., "2000€ from 2025-01 to 2025-06")
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS period_start TEXT; -- YYYY-MM format

ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS period_end TEXT; -- YYYY-MM format

-- Add constraints
ALTER TABLE budgets
ADD CONSTRAINT budgets_window_months_check
  CHECK (window_months IS NULL OR window_months > 0);

COMMENT ON COLUMN budgets.window_months IS 'For ROLLING budgets: number of months in the rolling window (e.g., 3 for "last 3 months")';
COMMENT ON COLUMN budgets.period_start IS 'For MULTI budgets: start month in YYYY-MM format';
COMMENT ON COLUMN budgets.period_end IS 'For MULTI budgets: end month in YYYY-MM format';
