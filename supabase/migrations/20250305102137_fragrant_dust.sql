-- Drop all existing policies
DROP POLICY IF EXISTS "allow_super_admin_manage_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_managers_manage_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_public_read_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_public_read" ON compensation_structures;

-- Create separate policies for each operation
CREATE POLICY "compensation_structures_select"
  ON compensation_structures
  FOR SELECT
  USING (true);

CREATE POLICY "compensation_structures_insert"
  ON compensation_structures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

CREATE POLICY "compensation_structures_update"
  ON compensation_structures
  FOR UPDATE
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

CREATE POLICY "compensation_structures_delete"
  ON compensation_structures
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );