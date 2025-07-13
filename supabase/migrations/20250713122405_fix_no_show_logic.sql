/*
  # Fix no-show logic when marking meetings as held

  1. Changes
    - Ensure no_show is set to false when marking a meeting as held
    - Improve trigger logic to handle held status changes properly
    - Fix issue where no-show badge remains when meeting is marked as held

  2. Purpose
    - Fix bug where no-show status persists after marking meeting as held
    - Ensure proper state management for held vs no-show meetings
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_meeting_status ON meetings;
DROP FUNCTION IF EXISTS update_meeting_status();

-- Create updated function to handle meeting status changes
CREATE OR REPLACE FUNCTION update_meeting_status()
RETURNS trigger AS $$
BEGIN
  -- For new meetings
  IF TG_OP = 'INSERT' THEN
    -- Set initial timestamps
    IF NEW.booked_at IS NULL THEN
      NEW.booked_at = now();
    END IF;
    
    -- All new meetings start as pending (no auto-confirmation)
    NEW.status = 'pending';
    NEW.confirmed_at = NULL;
  END IF;

  -- Handle status changes
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status = 'pending') THEN
    NEW.confirmed_at = now();
  ELSIF NEW.status = 'pending' AND OLD.status = 'confirmed' THEN
    NEW.confirmed_at = NULL;
  END IF;

  -- Auto-mark confirmed meetings as held when time has passed
  IF NEW.status = 'confirmed' AND NEW.held_at IS NULL THEN
    IF NEW.scheduled_date < now() THEN
      NEW.held_at = now();
      NEW.no_show = false;
    END IF;
  END IF;

  -- Handle manual held status changes
  IF NEW.held_at IS NOT NULL AND (OLD IS NULL OR OLD.held_at IS NULL) THEN
    -- If manually marking as held, ensure status is confirmed and no_show is false
    NEW.status = 'confirmed';
    NEW.no_show = false;
    -- Set confirmed_at if not already set
    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at = now();
    END IF;
  ELSIF NEW.held_at IS NULL AND OLD.held_at IS NOT NULL THEN
    -- If unmarking as held, check if it should be marked as no-show
    IF NEW.scheduled_date < now() THEN
      NEW.no_show = true;
    END IF;
  END IF;

  -- Check for no-shows on past meetings (only for pending meetings)
  IF NEW.status = 'pending' AND NEW.scheduled_date < now() AND NEW.held_at IS NULL THEN
    NEW.no_show = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for meeting status updates
CREATE TRIGGER update_meeting_status
  BEFORE INSERT OR UPDATE OF status, held_at, confirmed_at ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_status(); 