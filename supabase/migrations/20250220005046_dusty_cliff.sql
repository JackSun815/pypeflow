/*
  # Fix profile policies to avoid recursion

  1. Changes
    - Restructure profile policies to avoid circular dependencies
    - Simplify policy logic for better performance and reliability
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Managers can view all active profiles" ON profiles;

-- Create new policies without circular dependencies
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

-- Create a separate policy for managers to view other profiles
CREATE POLICY "Managers can view other active profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if either:
    -- 1. It's the user's own profile
    -- 2. The user is a manager and the profile is active
    id = auth.uid() OR
    (
      EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'manager'::user_role
      )
      AND active = true
    )
  );