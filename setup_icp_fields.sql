-- Add ICP Check fields to meetings table
-- Run this in your Supabase SQL Editor

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

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'meetings' 
  AND column_name IN ('icp_status', 'icp_checked_at', 'icp_checked_by', 'icp_notes')
ORDER BY column_name;
