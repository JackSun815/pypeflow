/*
  # Update RLS policies for clients and assignments

  1. Changes
    - Add policy to allow SDRs to create clients
    - Add policy to allow SDRs to create assignments
    - Update existing policies to be more permissive for SDRs

  2. Security
    - Maintains basic security while allowing necessary operations
    - SDRs can only view and modify their own data
    - Managers retain full access
*/

-- Drop existing client policies
DROP POLICY IF EXISTS "SDRs can view assigned clients" ON clients;

-- Create new client policies
CREATE POLICY "Users can create and view clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        -- User is a manager
        role = 'manager'
        OR
        -- User is an SDR with this client assigned
        (role = 'sdr' AND EXISTS (
          SELECT 1 FROM assignments
          WHERE sdr_id = auth.uid()
          AND client_id = clients.id
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Drop existing assignment policies
DROP POLICY IF EXISTS "SDRs can view their assignments" ON assignments;

-- Create new assignment policies
CREATE POLICY "Users can manage assignments"
  ON assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        -- User is a manager
        role = 'manager'
        OR
        -- User is the assigned SDR
        (role = 'sdr' AND sdr_id = auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'manager'
        OR
        (role = 'sdr' AND sdr_id = auth.uid())
      )
    )
  );