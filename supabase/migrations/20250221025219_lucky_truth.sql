/*
  # Fix Authentication Policies

  1. Changes
    - Add new policies for profiles table
    - Fix profile creation during signup
    - Allow public access for initial profile creation
    - Ensure proper role-based access

  2. Security
    - Enable RLS
    - Add appropriate policies for each operation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_read_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_manager_updates_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_manager_inserts_profiles" ON profiles;

-- Allow anyone to create their initial profile
CREATE POLICY "allow_initial_profile_creation"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own profile and managers to read all profiles
CREATE POLICY "allow_profile_read"
  ON profiles
  FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  );

-- Allow users to update their own profile and managers to update any profile
CREATE POLICY "allow_profile_update"
  ON profiles
  FOR UPDATE
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  )
  WITH CHECK (
    id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  );