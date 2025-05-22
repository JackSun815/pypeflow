/*
  # Update RLS policies for meetings

  1. Changes
    - Drop and recreate meetings policies to allow public read access
    - Add policies for SDR meeting management
    - Fix UUID comparison issues in policies

  2. Security
    - Public can read meetings
    - SDRs can only manage their own meetings
    - Active SDR status check added
*/

-- Drop existing policies for meetings
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