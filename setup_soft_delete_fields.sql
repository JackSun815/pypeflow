-- Add Soft Delete to Assignments Table
-- Run this in your Supabase SQL Editor

-- Add soft delete columns to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deactivation_reason text;

-- Add index for performance when filtering active assignments
CREATE INDEX IF NOT EXISTS idx_assignments_is_active ON assignments(is_active);

-- Add index for performance when filtering by deactivation reason
CREATE INDEX IF NOT EXISTS idx_assignments_deactivation_reason ON assignments(deactivation_reason);

-- Update existing assignments to be active (since they were created before this field existed)
UPDATE assignments SET is_active = true WHERE is_active IS NULL;

-- Function to soft delete assignments for a client in a specific month
CREATE OR REPLACE FUNCTION soft_delete_client_assignments(
  p_client_id uuid,
  p_month text,
  p_reason text DEFAULT 'client_removed_from_month'
)
RETURNS void AS $$
BEGIN
  UPDATE assignments 
  SET is_active = false,
      deactivated_at = now(),
      deactivation_reason = p_reason
  WHERE assignments.client_id = p_client_id 
    AND assignments.month = p_month
    AND assignments.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to restore soft deleted assignments for a client in a specific month
CREATE OR REPLACE FUNCTION restore_client_assignments(
  p_client_id uuid,
  p_month text
)
RETURNS void AS $$
BEGIN
  UPDATE assignments 
  SET is_active = true,
      deactivated_at = NULL,
      deactivation_reason = NULL
  WHERE assignments.client_id = p_client_id 
    AND assignments.month = p_month
    AND assignments.is_active = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get active assignments for a client in a specific month
CREATE OR REPLACE FUNCTION get_active_client_assignments(
  p_client_id uuid,
  p_month text
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
  WHERE a.client_id = p_client_id
    AND a.month = p_month
    AND a.is_active = true
    AND a.sdr_id IS NOT NULL; -- Exclude hidden markers
END;
$$ LANGUAGE plpgsql;
