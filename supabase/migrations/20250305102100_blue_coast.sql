-- Drop all existing policies
DROP POLICY IF EXISTS "allow_super_admin_manage_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_managers_manage_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_public_read_compensation" ON compensation_structures;

-- Create new policies for compensation structures
CREATE POLICY "allow_managers_manage_compensation"
  ON compensation_structures
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Create public read policy with a unique name
CREATE POLICY "compensation_structures_public_read"
  ON compensation_structures
  FOR SELECT
  USING (true);