/*
  # Fix profile policies to prevent recursion

  1. Changes
    - Remove circular dependencies in profile policies
    - Simplify policy structure
    - Add proper role-based access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Managers can view other active profiles" ON profiles;

-- Create simplified policies without circular dependencies
CREATE POLICY "Users can view and manage own profile"
  ON profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create a separate policy for managers to view other profiles
CREATE POLICY "Managers can view other profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'manager'
    )
  );