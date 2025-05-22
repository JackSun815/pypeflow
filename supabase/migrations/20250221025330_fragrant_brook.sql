/*
  # Fix Authentication and Database Permissions

  1. Changes
    - Add public access for initial profile creation
    - Fix profile read/write permissions
    - Ensure proper role-based access control
    - Add email column to profiles table

  2. Security
    - Enable RLS
    - Add appropriate policies for each operation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_initial_profile_creation" ON profiles;
DROP POLICY IF EXISTS "allow_profile_read" ON profiles;
DROP POLICY IF EXISTS "allow_profile_update" ON profiles;

-- Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Allow public access for initial profile creation
CREATE POLICY "public_create_profile"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow public read access for profiles
CREATE POLICY "public_read_profile"
  ON profiles
  FOR SELECT
  USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "auth_update_own_profile"
  ON profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  );

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