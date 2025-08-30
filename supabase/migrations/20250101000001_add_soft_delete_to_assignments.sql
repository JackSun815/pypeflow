/*
  # Add Soft Delete to Assignments
  
  This migration adds soft delete functionality to assignments to preserve meeting data
  when clients are removed from months. Instead of hard deleting assignments, we'll
  mark them as inactive.
  
  1. Changes
    - Add is_active column to assignments table (defaults to true)
    - Add deactivated_at timestamp column for when assignments were deactivated
    - Add deactivation_reason text column for tracking why assignments were deactivated
  
  2. Benefits
    - Preserves all meeting data when clients are removed from months
    - SDRs can still see their meeting history
    - Allows easy restoration of assignments if needed
    - Maintains data integrity and relationships
*/

-- Add soft delete columns to assignments table
ALTER TABLE assignments ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE assignments ADD COLUMN deactivated_at timestamptz;
ALTER TABLE assignments ADD COLUMN deactivation_reason text;

-- Add index for performance when filtering active assignments
CREATE INDEX idx_assignments_is_active ON assignments(is_active);

-- Add index for performance when filtering by deactivation reason
CREATE INDEX idx_assignments_deactivation_reason ON assignments(deactivation_reason);

-- Function to soft delete assignments for a client in a specific month
CREATE OR REPLACE FUNCTION soft_delete_client_assignments(
  client_id uuid,
  month text,
  reason text DEFAULT 'client_removed_from_month'
)
RETURNS void AS $$
BEGIN
  UPDATE assignments 
  SET is_active = false,
      deactivated_at = now(),
      deactivation_reason = reason
  WHERE assignments.client_id = soft_delete_client_assignments.client_id 
    AND assignments.month = soft_delete_client_assignments.month
    AND assignments.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to restore soft deleted assignments for a client in a specific month
CREATE OR REPLACE FUNCTION restore_client_assignments(
  client_id uuid,
  month text
)
RETURNS void AS $$
BEGIN
  UPDATE assignments 
  SET is_active = true,
      deactivated_at = NULL,
      deactivation_reason = NULL
  WHERE assignments.client_id = restore_client_assignments.client_id 
    AND assignments.month = restore_client_assignments.month
    AND assignments.is_active = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get active assignments for a client in a specific month
CREATE OR REPLACE FUNCTION get_active_client_assignments(
  client_id uuid,
  month text
)
RETURNS TABLE (
  id uuid,
  sdr_id uuid,
  monthly_set_target integer,
  monthly_hold_target integer,
  month text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.sdr_id,
    a.monthly_set_target,
    a.monthly_hold_target,
    a.month,
    a.created_at,
    a.updated_at
  FROM assignments a
  WHERE a.client_id = get_active_client_assignments.client_id
    AND a.month = get_active_client_assignments.month
    AND a.is_active = true
    AND a.sdr_id IS NOT NULL; -- Exclude hidden markers
END;
$$ LANGUAGE plpgsql;
