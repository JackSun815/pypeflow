-- Drop existing policies
DROP POLICY IF EXISTS "view_profiles" ON profiles;
DROP POLICY IF EXISTS "update_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_profiles" ON profiles;

-- Allow public read access to profiles
CREATE POLICY "allow_public_read"
  ON profiles
  FOR SELECT
  USING (true);

-- Allow managers to update profiles
CREATE POLICY "allow_manager_updates"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  );

-- Allow managers to insert profiles
CREATE POLICY "allow_manager_inserts"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  );

-- Allow public read access to assignments
CREATE POLICY "allow_public_read_assignments"
  ON assignments
  FOR SELECT
  USING (true);

-- Allow public read access to clients
CREATE POLICY "allow_public_read_clients"
  ON clients
  FOR SELECT
  USING (true);

-- Allow public read access to meetings
CREATE POLICY "allow_public_read_meetings"
  ON meetings
  FOR SELECT
  USING (true);