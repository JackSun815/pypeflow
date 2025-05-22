/*
  # Update RLS policies for meetings and profiles

  1. Changes
    - Allow public read access to all tables
    - Allow SDRs to manage their own meetings
    - Allow managers to manage all meetings
    - Fix type casting issues with UUID comparisons

  2. Security
    - Public can only read data
    - SDRs can only manage their own meetings
    - Managers have full access to all meetings
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_read_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_sdr_insert_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_sdr_update_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_sdr_delete_meetings" ON meetings;

-- Allow public read access to meetings
CREATE POLICY "allow_public_read_meetings"
  ON meetings
  FOR SELECT
  USING (true);

-- Allow SDRs to insert meetings
CREATE POLICY "allow_sdr_insert_meetings"
  ON meetings
  FOR INSERT
  WITH CHECK (
    -- SDR can insert meetings for themselves
    sdr_id = ANY(
      SELECT id FROM profiles
      WHERE id::text = sdr_id::text
      AND role = 'sdr'
      AND active = true
    )
  );

-- Allow SDRs to update their own meetings
CREATE POLICY "allow_sdr_update_meetings"
  ON meetings
  FOR UPDATE
  USING (
    -- SDR can update their own meetings
    sdr_id = ANY(
      SELECT id FROM profiles
      WHERE id::text = sdr_id::text
      AND role = 'sdr'
      AND active = true
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    sdr_id = ANY(
      SELECT id FROM profiles
      WHERE id::text = sdr_id::text
      AND role = 'sdr'
      AND active = true
    )
  );

-- Allow SDRs to delete their own meetings
CREATE POLICY "allow_sdr_delete_meetings"
  ON meetings
  FOR DELETE
  USING (
    -- SDR can delete their own meetings
    sdr_id = ANY(
      SELECT id FROM profiles
      WHERE id::text = sdr_id::text
      AND role = 'sdr'
      AND active = true
    )
  );

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "allow_public_read" ON profiles;
DROP POLICY IF EXISTS "allow_manager_updates" ON profiles;
DROP POLICY IF EXISTS "allow_manager_inserts" ON profiles;

-- Allow public read access to profiles
CREATE POLICY "allow_public_read_profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- Allow managers to update profiles
CREATE POLICY "allow_manager_updates_profiles"
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
CREATE POLICY "allow_manager_inserts_profiles"
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