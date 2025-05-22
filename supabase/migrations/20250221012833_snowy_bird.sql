/*
  # Update profile constraints for SDR management

  1. Changes
    - Remove foreign key constraint to auth.users
    - Add UUID generation for profile IDs
    - Update RLS policies for better security
*/

-- First drop the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Modify the profiles table to use generated UUIDs
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Drop existing policies
DROP POLICY IF EXISTS "view_profiles" ON profiles;
DROP POLICY IF EXISTS "update_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_profiles" ON profiles;

-- Basic policy for viewing profiles
CREATE POLICY "view_profiles"
  ON profiles
  FOR SELECT
  USING (true); -- Allow public read access for SDR dashboard links

-- Policy for updating profiles
CREATE POLICY "update_profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Policy for inserting profiles
CREATE POLICY "insert_profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );