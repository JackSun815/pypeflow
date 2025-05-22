/*
  # Update RLS policies for profiles and meetings

  1. Changes
    - Drop and recreate policies for profiles and meetings
    - Add proper authentication checks
    - Fix permission issues for public access

  2. Security
    - Allow public read access to profiles and meetings
    - Ensure proper authentication for write operations
    - Add manager-specific permissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_read_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_sdr_insert_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_sdr_update_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_sdr_delete_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_public_read_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_manager_updates_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_manager_inserts_profiles" ON profiles;

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
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
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
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

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
    EXISTS (
      SELECT 1
      FROM profiles
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
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id::text = sdr_id::text
      AND role = 'sdr'
      AND active = true
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    EXISTS (
      SELECT 1
      FROM profiles
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
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id::text = sdr_id::text
      AND role = 'sdr'
      AND active = true
    )
  );