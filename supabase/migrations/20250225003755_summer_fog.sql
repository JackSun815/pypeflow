-- Add super_admin column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'super_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN super_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create or update super admin profile
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

-- Drop existing compensation structure policies if they exist
DROP POLICY IF EXISTS "allow_manager_manage_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_super_admin_manage_compensation" ON compensation_structures;

-- Create new policy for super admin to manage compensation
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