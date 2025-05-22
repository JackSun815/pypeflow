/*
  # Update RLS policies for meetings table

  1. Changes
    - Allow public read access to meetings
    - Allow SDRs to manage their own meetings
    - Allow managers to manage all meetings

  2. Security
    - Public can only read meetings
    - SDRs can only manage their own meetings
    - Managers have full access to all meetings
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_read_meetings" ON meetings;
DROP POLICY IF EXISTS "SDRs can CRUD their own meetings" ON meetings;

-- Allow public read access to meetings
CREATE POLICY "allow_public_read_meetings"
  ON meetings
  FOR SELECT
  USING (true);

-- Allow SDRs to insert their own meetings
CREATE POLICY "allow_sdr_insert_meetings"
  ON meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- SDR can only insert meetings for themselves
    sdr_id::text = auth.uid()::text OR
    -- Managers can insert meetings for any SDR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  );

-- Allow SDRs to update their own meetings
CREATE POLICY "allow_sdr_update_meetings"
  ON meetings
  FOR UPDATE
  TO authenticated
  USING (
    -- SDR can only update their own meetings
    sdr_id::text = auth.uid()::text OR
    -- Managers can update any meetings
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    sdr_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  );

-- Allow SDRs to delete their own meetings
CREATE POLICY "allow_sdr_delete_meetings"
  ON meetings
  FOR DELETE
  TO authenticated
  USING (
    -- SDR can only delete their own meetings
    sdr_id::text = auth.uid()::text OR
    -- Managers can delete any meetings
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'manager'
    )
  );