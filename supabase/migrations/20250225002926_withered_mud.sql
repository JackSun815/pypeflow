/*
  # Super Admin Authentication System

  1. Changes
    - Add super_admin column to profiles table
    - Create initial super admin user
    - Update policies to restrict management access to super admin

  2. Security
    - Enable RLS
    - Add policies for super admin access
*/

-- Add super_admin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS super_admin boolean DEFAULT false;

-- Create profile for super admin if it doesn't exist
INSERT INTO profiles (
  email,
  role,
  full_name,
  super_admin,
  active
)
VALUES (
  'eric@parakeet.io',
  'manager',
  'Super Admin',
  true,
  true
)
ON CONFLICT (email) 
DO UPDATE SET 
  super_admin = true,
  active = true,
  role = 'manager',
  full_name = 'Super Admin';

-- Update policies to restrict management to super admin
DROP POLICY IF EXISTS "allow_manager_manage_compensation" ON compensation_structures;
CREATE POLICY "allow_super_admin_manage_compensation"
  ON compensation_structures
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND super_admin = true
    )
  );