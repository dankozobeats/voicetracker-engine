-- Add reminders column to recurring_charges table
-- This allows users to set reminders for updating charge amounts

ALTER TABLE recurring_charges
ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN recurring_charges.reminders IS 'Array of reminder objects. Each reminder has: id (uuid), month (YYYY-MM), note (string), dismissed (boolean). Example: [{"id": "uuid", "month": "2025-03", "note": "Update rent amount", "dismissed": false}]';
