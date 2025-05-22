/*
  # Fix Profile RLS Policies

  1. Changes
    - Add policy for managers to create SDR profiles
    - Simplify existing policies to avoid circular dependencies
    - Ensure proper access control for profile management

  2. Security
    - Maintain strict RLS for profile access
    - Allow managers to create and manage SDR profiles
    - Preserve user's ability to manage their own profile
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Basic policy for viewing profiles
CREATE POLICY "view_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile
    id = auth.uid() OR
    -- Managers can view all profiles
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'manager'
    )
  );

-- Policy for updating profiles
CREATE POLICY "update_profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own profile
    id = auth.uid() OR
    -- Managers can update SDR profiles
    (
      EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'manager'
      )
      AND role = 'sdr'
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    id = auth.uid() OR
    (
      EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'manager'
      )
      AND role = 'sdr'
    )
  );

-- Policy for inserting profiles
CREATE POLICY "insert_profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can create their own profile
    id = auth.uid() OR
    -- Managers can create SDR profiles
    (
      EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'manager'
      )
      AND role = 'sdr'
    )
  );

-- Policy for deleting profiles
CREATE POLICY "delete_profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    -- Only managers can delete profiles, and only SDR profiles
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'manager'
    )
    AND role = 'sdr'
  );