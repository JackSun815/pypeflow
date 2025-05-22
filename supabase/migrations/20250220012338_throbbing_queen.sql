/*
  # Add email field to profiles table

  1. Changes
    - Add email column to profiles table
    - Add unique constraint on email
    - Add trigger to sync email with auth.users
*/

-- Add email column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Add unique constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Create a function to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email when user is created or updated
DROP TRIGGER IF EXISTS sync_user_email ON auth.users;
CREATE TRIGGER sync_user_email
  AFTER INSERT OR UPDATE OF email
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Sync existing emails
UPDATE profiles
SET email = users.email
FROM auth.users
WHERE profiles.id = users.id
  AND profiles.email IS NULL;