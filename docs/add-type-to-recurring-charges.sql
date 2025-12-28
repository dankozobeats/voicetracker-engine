-- Add type column to recurring_charges table
-- This allows recurring charges to be either INCOME (salary) or EXPENSE (rent, subscriptions)

ALTER TABLE recurring_charges
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'EXPENSE' CHECK (type IN ('INCOME', 'EXPENSE'));

-- Update existing records to be EXPENSE by default
UPDATE recurring_charges
SET type = 'EXPENSE'
WHERE type IS NULL OR type = '';

-- Add index for performance
CREATE INDEX IF NOT EXISTS recurring_charges_type_idx ON recurring_charges(type);
