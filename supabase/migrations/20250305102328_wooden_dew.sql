-- Drop all existing policies and functions
DROP POLICY IF EXISTS "manage_compensation_structures" ON compensation_structures;
DROP POLICY IF EXISTS "allow_super_admin_manage_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_managers_manage_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_public_read_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_public_read" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_select" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_insert" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_update" ON compensation_structures;
DROP POLICY IF EXISTS "compensation_structures_delete" ON compensation_structures;

DROP FUNCTION IF EXISTS is_user_manager();

-- Disable RLS on compensation_structures table
ALTER TABLE compensation_structures DISABLE ROW LEVEL SECURITY;

-- Create a basic policy that allows all operations
CREATE POLICY "allow_all_operations"
  ON compensation_structures
  FOR ALL
  USING (true)
  WITH CHECK (true);