/*
  # Add contact information to meetings table

  1. Changes
    - Add contact_full_name column to meetings table
    - Add contact_email column to meetings table

  2. Notes
    - Both fields are optional to maintain compatibility with existing records
    - No changes to RLS policies needed as they are controlled by the existing meeting permissions
*/

DO $$ 
BEGIN
  -- Add contact_full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'contact_full_name'
  ) THEN
    ALTER TABLE meetings ADD COLUMN contact_full_name text;
  END IF;

  -- Add contact_email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE meetings ADD COLUMN contact_email text;
  END IF;
END $$;