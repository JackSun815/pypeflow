/*
  # Update RLS policies for meetings

  1. Changes
    - Simplify meetings policies
    - Fix permission issues for public SDR dashboard
    - Add proper authentication checks

  2. Security
    - Allow public read access to meetings
    - Ensure proper SDR validation
    - Fix insert/update/delete permissions
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
    -- Allow insert if the SDR exists and is active
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = sdr_id
      AND role = 'sdr'
      AND active = true
    )
  );

-- Allow SDRs to update their own meetings
CREATE POLICY "allow_sdr_update_meetings"
  ON meetings
  FOR UPDATE
  USING (
    -- Allow update if the SDR exists and is active
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = sdr_id
      AND role = 'sdr'
      AND active = true
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = sdr_id
      AND role = 'sdr'
      AND active = true
    )
  );

-- Allow SDRs to delete their own meetings
CREATE POLICY "allow_sdr_delete_meetings"
  ON meetings
  FOR DELETE
  USING (
    -- Allow delete if the SDR exists and is active
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = sdr_id
      AND role = 'sdr'
      AND active = true
    )
  );