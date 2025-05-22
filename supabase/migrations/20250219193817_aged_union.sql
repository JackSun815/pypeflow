/*
  # Fix profiles policies recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies with a different approach for manager access
    - Add insert policy for profile creation during signup

  2. Security
    - Users can read and update their own profile
    - Managers can read all profiles
    - New users can create their profile during signup
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies
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
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'manager'
  );
$$;

-- Create manager view policy using the function
CREATE POLICY "Managers can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    is_manager()
  );