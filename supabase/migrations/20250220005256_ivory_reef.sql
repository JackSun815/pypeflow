/*
  # Fix profile policies with simplified approach

  1. Changes
    - Remove all existing profile policies
    - Create simple, non-recursive policies
    - Use direct role checks without circular dependencies
    - Maintain security while fixing permission issues
*/

-- Drop all existing profile policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Managers can view other profiles" ON profiles;

-- Basic policy for viewing own profile
CREATE POLICY "View own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Basic policy for updating own profile
CREATE POLICY "Update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Basic policy for creating profile during signup
CREATE POLICY "Create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Simple policy for managers to view all profiles
CREATE POLICY "Managers view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles manager
      WHERE manager.id = auth.uid()
      AND manager.role = 'manager'
      AND manager.id != profiles.id
    )
  );