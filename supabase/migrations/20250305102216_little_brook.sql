-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "allow_super_admin_manage_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_managers_manage_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_public_read_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_public_read" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_select" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_insert" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_update" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_delete" ON compensation_structures;

-- Create a function to check if a user is a manager
CREATE OR REPLACE FUNCTION is_user_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'manager'
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a single policy for all operations
CREATE POLICY "manage_compensation_structures"
  ON compensation_structures
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    -- Allow managers to manage all compensation structures
    is_user_manager()
    OR
    -- Allow SDRs to view their own compensation structure
    (
      auth.uid() IS NOT NULL
      AND sdr_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Only managers can modify compensation structures
    is_user_manager()
  );