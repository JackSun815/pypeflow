/*
  # Add meeting held functionality

  1. Changes
    - Add held_at timestamp column to meetings table
    - Add no_show boolean column to meetings table
    - Create trigger to manage held_at and no_show status
    - Update existing meetings to set no_show for past pending meetings

  2. Security
    - Maintains existing RLS policies
    - No changes to access control
*/

-- Add new columns to meetings table if they don't exist
ALTER TABLE meetings 
  ADD COLUMN IF NOT EXISTS held_at timestamptz,
  ADD COLUMN IF NOT EXISTS no_show boolean DEFAULT false;

-- Create function to check if a meeting is past due
CREATE OR REPLACE FUNCTION is_meeting_past_due(meeting_date timestamptz)
RETURNS boolean AS $$
BEGIN
  RETURN meeting_date < now();
END;
$$ LANGUAGE plpgsql;

-- Create function to update meeting status and timestamps
CREATE OR REPLACE FUNCTION update_meeting_status()
RETURNS trigger AS $$
BEGIN
  -- Handle status changes
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status = 'pending') THEN
    NEW.held_at = now();
    NEW.no_show = false;
  ELSIF NEW.status = 'pending' AND OLD.status = 'confirmed' THEN
    NEW.held_at = null;
    NEW.no_show = is_meeting_past_due(NEW.scheduled_date);
  END IF;

  -- Check for no-shows on past meetings
  IF NEW.status = 'pending' AND is_meeting_past_due(NEW.scheduled_date) THEN
    NEW.no_show = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for meeting status updates
DROP TRIGGER IF EXISTS update_meeting_status ON meetings;
CREATE TRIGGER update_meeting_status
  BEFORE INSERT OR UPDATE OF status ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_status();

-- Update existing meetings to set no_show for past pending meetings
UPDATE meetings
SET no_show = true
WHERE status = 'pending'
  AND scheduled_date < now()
  AND no_show = false;