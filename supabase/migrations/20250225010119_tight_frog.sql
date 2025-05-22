-- Add new columns to meetings table
ALTER TABLE meetings 
  ADD COLUMN IF NOT EXISTS held_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
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
  -- For new meetings
  IF TG_OP = 'INSERT' THEN
    -- Set initial timestamps
    NEW.booked_at = now();
    
    -- If scheduled within 3 days, auto-confirm
    IF NEW.scheduled_date <= (now() + interval '3 days') THEN
      NEW.status = 'confirmed';
      NEW.confirmed_at = now();
    END IF;
  END IF;

  -- Handle status changes
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status = 'pending') THEN
    NEW.confirmed_at = now();
  END IF;

  -- Handle held status
  IF NEW.held_at IS NOT NULL AND OLD.held_at IS NULL THEN
    NEW.status = 'confirmed';
    NEW.no_show = false;
  ELSIF NEW.held_at IS NULL AND OLD.held_at IS NOT NULL THEN
    -- If unmarking as held, check if it should be marked as no-show
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
  BEFORE INSERT OR UPDATE OF status, held_at ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_status();

-- Update existing meetings to set proper status
UPDATE meetings
SET 
  no_show = true,
  status = 'pending'
WHERE status = 'pending'
  AND scheduled_date < now()
  AND no_show = false;