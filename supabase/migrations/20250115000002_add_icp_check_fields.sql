/*
  # Add ICP Check fields to meetings table

  1. Changes
    - Add icp_status field to track ICP approval status
    - Add icp_checked_at timestamp for when manager reviewed
    - Add icp_checked_by field to track which manager reviewed
    - Add icp_notes field for manager comments

  2. Purpose
    - Enable ICP qualification workflow
    - Track approval/denial status
    - Maintain audit trail of ICP decisions
*/

-- Add ICP-related columns to meetings table
ALTER TABLE meetings 
  ADD COLUMN IF NOT EXISTS icp_status text DEFAULT 'pending' CHECK (icp_status IN ('pending', 'approved', 'denied')),
  ADD COLUMN IF NOT EXISTS icp_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS icp_checked_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS icp_notes text;

-- Create index for efficient ICP status queries
CREATE INDEX IF NOT EXISTS idx_meetings_icp_status ON meetings(icp_status);
CREATE INDEX IF NOT EXISTS idx_meetings_icp_checked_at ON meetings(icp_checked_at);

-- Update existing meetings to have 'pending' ICP status
UPDATE meetings 
SET icp_status = 'pending' 
WHERE icp_status IS NULL;
