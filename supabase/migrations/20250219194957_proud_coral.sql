/*
  # Fix RLS policies for client creation

  1. Changes
    - Simplify client creation policy to allow any authenticated user to create clients
    - Maintain view restrictions based on assignments
    - Update assignment policies to be more permissive for initial setup

  2. Security
    - Still maintains basic security while allowing necessary operations
    - View restrictions remain in place
    - Only authenticated users can create data
*/

-- Drop existing client policies
DROP POLICY IF EXISTS "Users can create and view clients" ON clients;

-- Create separate policies for viewing and creating clients
CREATE POLICY "Users can view assigned clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'manager'
        OR
        EXISTS (
          SELECT 1 FROM assignments
          WHERE sdr_id = auth.uid()
          AND client_id = clients.id
        )
      )
    )
  );

CREATE POLICY "Users can create clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Drop existing assignment policies
DROP POLICY IF EXISTS "Users can manage assignments" ON assignments;

-- Create separate policies for assignments
CREATE POLICY "Users can view assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'manager'
        OR
        sdr_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'manager'
        OR
        sdr_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'manager'
        OR
        sdr_id = auth.uid()
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
        sdr_id = auth.uid()
      )
    )
  );