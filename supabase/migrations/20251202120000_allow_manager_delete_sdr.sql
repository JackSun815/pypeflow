-- Allow deleting SDR profiles (and cascaded data) from the app.
-- This is intentionally generous: any authenticated user can delete rows where role = 'sdr'.
-- In practice, only managers see the delete UI in the app.

-- Safety: drop any old delete policy if it exists
DROP POLICY IF EXISTS "profiles_manager_delete" ON profiles;

CREATE POLICY "profiles_manager_delete"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    -- Only allow deleting SDR profiles
    role = 'sdr'
  );


