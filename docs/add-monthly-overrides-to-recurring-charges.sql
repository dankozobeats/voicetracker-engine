-- Add monthly_overrides column to recurring_charges table
-- This allows users to define different amounts for specific months
-- Example: Base amount 100€, but 150€ in December, 80€ in August

ALTER TABLE recurring_charges
ADD COLUMN IF NOT EXISTS monthly_overrides JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN recurring_charges.monthly_overrides IS 'JSON object mapping month (YYYY-MM) to custom amount for that month. Example: {"2025-12": 150, "2025-08": 80}';

-- Example usage:
-- UPDATE recurring_charges
-- SET monthly_overrides = '{"2025-12": 150, "2025-08": 80}'::jsonb
-- WHERE label = 'Électricité';
