-- First drop the existing trigger and functions
DROP TRIGGER IF EXISTS update_meeting_status ON meetings;
DROP FUNCTION IF EXISTS update_meeting_status();
DROP FUNCTION IF EXISTS is_meeting_past_due();

-- Add new date columns
ALTER TABLE meetings 
  ADD COLUMN IF NOT EXISTS held_date date,
  ADD COLUMN IF NOT EXISTS confirmed_date date;

-- Convert scheduled_date to date if it's not already
ALTER TABLE meetings 
  ALTER COLUMN scheduled_date TYPE date USING scheduled_date::date;

-- Create function to check if a meeting is past due
CREATE OR REPLACE FUNCTION is_meeting_past_due(meeting_date date)
RETURNS boolean AS $$
BEGIN
  RETURN meeting_date < current_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to update meeting status
CREATE OR REPLACE FUNCTION update_meeting_status()
RETURNS trigger AS $$
BEGIN
  -- For new meetings
  IF TG_OP = 'INSERT' THEN
    -- If scheduled within 3 days, auto-confirm
    IF NEW.scheduled_date <= (current_date + interval '3 days') THEN
      NEW.status = 'confirmed';
      NEW.confirmed_date = current_date;
    END IF;
  END IF;

  -- Handle status changes
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status = 'pending') THEN
    NEW.confirmed_date = current_date;
  END IF;

  -- Handle held status
  IF NEW.held_date IS NOT NULL AND OLD.held_date IS NULL THEN
    NEW.status = 'confirmed';
    NEW.no_show = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for meeting status updates
CREATE TRIGGER update_meeting_status
  BEFORE INSERT OR UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_status();