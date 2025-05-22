/*
  # Add monthly target to clients table

  1. Changes
    - Add monthly_target column to clients table if it doesn't exist
    - Set default value to 0
    - Make it non-nullable
*/

ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_target integer NOT NULL DEFAULT 0;