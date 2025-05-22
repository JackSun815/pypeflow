/*
  # Fix profile policies to use proper authentication

  1. Changes
    - Remove direct auth.users table access
    - Use proper role-based access control through profiles table
    - Simplify policy structure
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view and manage own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view other profiles" ON profiles;

-- Create simplified policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Managers can view other profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );