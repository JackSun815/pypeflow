/*
  # Fix RLS policies for SDR management

  1. Changes
    - Simplify RLS policies to properly handle manager permissions
    - Allow managers to create and manage SDR profiles
    - Fix circular dependencies in policy checks
    - Add proper role-based access control

  2. Security
    - Maintain strict access control based on user roles
    - Ensure managers can only manage SDR profiles
    - Prevent unauthorized access and modifications
*/

-- Drop existing policies
DROP POLICY IF EXISTS "view_profiles" ON profiles;
DROP POLICY IF EXISTS "update_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_profiles" ON profiles;
DROP POLICY IF EXISTS "delete_profiles" ON profiles;

-- Create a function to check if a user is a manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role')::text = 'manager'
  );
$$;

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
  FOR DELETE
  TO authenticated
  USING (
    is_manager() AND role = 'sdr' -- Only managers can delete SDR profiles
  );