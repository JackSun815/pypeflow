/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing profiles policies that cause infinite recursion
    - Add new, simplified policies for profiles table access

  2. Security
    - Users can read and update their own profile
    - Managers can read all profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON profiles;

-- Create new policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Managers can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
  );

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());