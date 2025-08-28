/*
  # Add Client Archiving System
  
  This migration adds soft delete functionality to clients to preserve historical data.
  Instead of hard deleting clients, we'll archive them by setting archived_at timestamp.
  
  1. Changes
    - Add archived_at column to clients table
    - Add index for performance on archived queries
    - Add helper functions for archiving/unarchiving clients
  
  2. Benefits
    - Preserves all historical meeting data
    - Allows recovery of accidentally "deleted" clients
    - Maintains data integrity for reporting
*/

-- Add archived_at column to clients table
ALTER TABLE clients ADD COLUMN archived_at timestamptz;

-- Add index for performance when filtering archived clients
CREATE INDEX idx_clients_archived_at ON clients(archived_at);

-- Function to archive a client (soft delete)
CREATE OR REPLACE FUNCTION archive_client(client_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE clients 
  SET archived_at = now(),
      updated_at = now()
  WHERE id = client_id 
    AND archived_at IS NULL; -- Only archive if not already archived
END;
$$ LANGUAGE plpgsql;

-- Function to unarchive a client (restore)
CREATE OR REPLACE FUNCTION unarchive_client(client_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE clients 
  SET archived_at = NULL,
      updated_at = now()
  WHERE id = client_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get active (non-archived) clients
CREATE OR REPLACE FUNCTION get_active_clients()
RETURNS TABLE (
  id uuid,
  name text,
  monthly_target integer,
  monthly_set_target integer,
  monthly_hold_target integer,
  cumulative_set_target integer,
  cumulative_hold_target integer,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.monthly_target,
    c.monthly_set_target,
    c.monthly_hold_target,
    c.cumulative_set_target,
    c.cumulative_hold_target,
    c.created_at,
    c.updated_at
  FROM clients c
  WHERE c.archived_at IS NULL
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get archived clients
CREATE OR REPLACE FUNCTION get_archived_clients()
RETURNS TABLE (
  id uuid,
  name text,
  monthly_target integer,
  monthly_set_target integer,
  monthly_hold_target integer,
  cumulative_set_target integer,
  cumulative_hold_target integer,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.monthly_target,
    c.monthly_set_target,
    c.monthly_hold_target,
    c.cumulative_set_target,
    c.cumulative_hold_target,
    c.created_at,
    c.updated_at,
    c.archived_at
  FROM clients c
  WHERE c.archived_at IS NOT NULL
  ORDER BY c.archived_at DESC;
END;
$$ LANGUAGE plpgsql;
