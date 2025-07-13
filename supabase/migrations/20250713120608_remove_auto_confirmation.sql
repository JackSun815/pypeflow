/*
  # Remove auto-confirmation logic

  1. Changes
    - Remove 3-day auto-confirmation logic from trigger function
    - Ensure all new meetings start as pending
    - Keep manual confirmation functionality

  2. Purpose
    - Fix issue where meetings are auto-confirmed when scheduled within 3 days
    - Ensure all meetings require manual confirmation
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
    -- If manually marking as held, ensure status is confirmed
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

  -- Check for no-shows on past meetings
  IF NEW.status = 'pending' AND NEW.scheduled_date < now() THEN
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