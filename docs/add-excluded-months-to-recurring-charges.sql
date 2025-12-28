-- Add excluded_months column to recurring_charges table
-- This allows users to temporarily suspend a recurring charge for specific months
-- Example: Suspend Netflix subscription for July and August (vacation months)

ALTER TABLE recurring_charges
ADD COLUMN IF NOT EXISTS excluded_months TEXT[] DEFAULT '{}';

COMMENT ON COLUMN recurring_charges.excluded_months IS 'Array of months (YYYY-MM format) where this charge should NOT apply';

-- Example usage:
-- UPDATE recurring_charges
-- SET excluded_months = ARRAY['2025-07', '2025-08']
-- WHERE label = 'Netflix';
