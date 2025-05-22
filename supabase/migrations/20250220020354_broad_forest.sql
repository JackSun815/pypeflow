/*
  # Fix Authentication Permissions

  1. Changes
    - Remove direct auth.users table access
    - Use JWT claims for role checks
    - Simplify RLS policies
    - Add helper functions for role checks

  2. Security
    - Maintain strict RLS
    - Use JWT claims for authorization
    - Prevent unauthorized access
*/

-- Create a function to check if the current user is a manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(auth.jwt()->>'role' = 'manager', false);
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "view_profiles" ON profiles;
DROP POLICY IF EXISTS "update_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_profiles" ON profiles;
DROP POLICY IF EXISTS "delete_profiles" ON profiles;

-- Basic policy for viewing profiles
CREATE POLICY "view_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR -- Can view own profile
    is_manager() -- Managers can view all profiles
  );

-- Policy for updating profiles
CREATE POLICY "update_profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR -- Can update own profile
    (is_manager() AND role = 'sdr') -- Managers can update SDR profiles
  )
  WITH CHECK (
    id = auth.uid() OR
    (is_manager() AND role = 'sdr')
  );

-- Policy for inserting profiles
CREATE POLICY "insert_profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid() OR -- Can create own profile
    (is_manager() AND role = 'sdr') -- Managers can create SDR profiles
  );

-- Policy for deleting profiles (soft delete via active flag)
CREATE POLICY "delete_profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_manager() AND role = 'sdr' -- Only managers can deactivate SDR profiles
  )
  WITH CHECK (
    is_manager() AND role = 'sdr'
  );