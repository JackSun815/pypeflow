/*
  # Add no_longer_interested field to meetings table

  1. Changes
    - Add no_longer_interested boolean field to meetings table
    - Default value is false
    - Used to track meetings where the prospect is no longer interested

  2. Purpose
    - Support new meeting status for better prospect tracking
    - Allow SDRs to mark meetings as "no longer interested"
    - Separate from no_show status (which is for missed meetings)
*/

-- Add no_longer_interested column to meetings table
ALTER TABLE meetings 
  ADD COLUMN IF NOT EXISTS no_longer_interested boolean DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN meetings.no_longer_interested IS 'Indicates if the prospect is no longer interested in the meeting/opportunity';
