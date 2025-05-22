/*
  # Update meetings table for held/no-show tracking

  1. Changes
    - Add held_at timestamp to track when meetings were held
    - Add no_show boolean flag for tracking no-shows
    - Add trigger to automatically mark meetings as no-shows when past due

  2. Security
    - Maintain existing RLS policies
    - Add function to check for past due meetings
*/

-- Add new columns to meetings table
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

-- Create function to update meeting status
CREATE OR REPLACE FUNCTION update_meeting_status()
RETURNS trigger AS $$
BEGIN
  -- If meeting is marked as held, update held_at timestamp
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    NEW.held_at = now();
    NEW.no_show = false;
  -- If meeting is unmarked as held, clear held_at timestamp
  ELSIF NEW.status = 'pending' AND OLD.status = 'confirmed' THEN
    NEW.held_at = null;
    -- Check if meeting is past due
    NEW.no_show = is_meeting_past_due(NEW.scheduled_date);
  END IF;

  -- For new meetings or status updates
  IF NEW.status = 'pending' AND is_meeting_past_due(NEW.scheduled_date) THEN
    NEW.no_show = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for meeting status updates
DROP TRIGGER IF EXISTS update_meeting_status ON meetings;
CREATE TRIGGER update_meeting_status
  BEFORE INSERT OR UPDATE OF status ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_status();