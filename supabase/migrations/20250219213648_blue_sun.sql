/*
  # Add monthly target to clients table

  1. Changes
    - Add `monthly_target` column to `clients` table with default value of 0
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'monthly_target'
  ) THEN
    ALTER TABLE clients ADD COLUMN monthly_target integer NOT NULL DEFAULT 0;
  END IF;
END $$;