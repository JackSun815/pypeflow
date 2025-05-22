/*
  # Add active field to profiles

  1. Changes
    - Add `active` boolean column to profiles table with default true
    - Update RLS policies to only show active profiles
*/

-- Add active column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON profiles;

-- Create updated policies
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

CREATE POLICY "Managers can view all active profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
    AND active = true
  );