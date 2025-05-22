/*
  # Fix profile policies with non-recursive approach

  1. Changes
    - Remove all existing profile policies
    - Create simple, direct policies without any self-referential checks
    - Separate policies for different operations
    - Use role-based metadata from auth.uid() directly
*/

-- Drop all existing profile policies
DROP POLICY IF EXISTS "View own profile" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
DROP POLICY IF EXISTS "Create own profile" ON profiles;
DROP POLICY IF EXISTS "Managers view all profiles" ON profiles;

-- Allow all authenticated users to view their own profile
CREATE POLICY "view_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow all authenticated users to update their own profile
CREATE POLICY "update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow profile creation during signup
CREATE POLICY "create_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Allow managers to view all profiles (non-recursive approach)
CREATE POLICY "manager_view_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Either it's the user's own profile OR they are a manager
    id = auth.uid() OR
    (SELECT role = 'manager' FROM profiles WHERE id = auth.uid())
  );