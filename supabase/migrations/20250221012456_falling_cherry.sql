/*
  # Update profile policies for SDR management

  1. Changes
    - Allow managers to create SDR profiles without authentication checks
    - Simplify RLS policies for better maintainability
*/

-- Drop existing policies
DROP POLICY IF EXISTS "view_profiles" ON profiles;
DROP POLICY IF EXISTS "update_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_profiles" ON profiles;
DROP POLICY IF EXISTS "delete_profiles" ON profiles;

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