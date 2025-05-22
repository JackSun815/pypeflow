-- Drop existing policies
DROP POLICY IF EXISTS "view_profiles" ON profiles;
DROP POLICY IF EXISTS "update_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_profiles" ON profiles;
DROP POLICY IF EXISTS "delete_profiles" ON profiles;

-- Basic policy for viewing profiles
CREATE POLICY "view_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile
    id = auth.uid() OR
    -- Managers can view all profiles
    EXISTS (
      SELECT 1
      FROM profiles manager
      WHERE manager.id = auth.uid()
      AND manager.role = 'manager'
    )
  );

-- Policy for updating profiles
CREATE POLICY "update_profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own profile
    id = auth.uid() OR
    -- Managers can update SDR profiles
    (
      EXISTS (
        SELECT 1
        FROM profiles manager
        WHERE manager.id = auth.uid()
        AND manager.role = 'manager'
      )
      AND role = 'sdr'
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    id = auth.uid() OR
    (
      EXISTS (
        SELECT 1
        FROM profiles manager
        WHERE manager.id = auth.uid()
        AND manager.role = 'manager'
      )
      AND role = 'sdr'
    )
  );

-- Policy for inserting profiles
CREATE POLICY "insert_profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can create their own profile
    id = auth.uid() OR
    -- Managers can create SDR profiles
    (
      EXISTS (
        SELECT 1
        FROM profiles manager
        WHERE manager.id = auth.uid()
        AND manager.role = 'manager'
      )
      AND role = 'sdr'
    )
  );

-- Policy for deleting profiles (soft delete via active flag)
CREATE POLICY "delete_profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Only managers can deactivate SDR profiles
    EXISTS (
      SELECT 1
      FROM profiles manager
      WHERE manager.id = auth.uid()
      AND manager.role = 'manager'
    )
    AND role = 'sdr'
  )
  WITH CHECK (
    -- Same conditions as USING clause
    EXISTS (
      SELECT 1
      FROM profiles manager
      WHERE manager.id = auth.uid()
      AND manager.role = 'manager'
    )
    AND role = 'sdr'
  );