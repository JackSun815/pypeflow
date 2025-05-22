/*
  # Add meeting confirmed field

  1. Changes
     - Ensure confirmed_at column exists in meetings table
     - Update trigger function to handle confirmed_at properly
     - Add logic to set status to confirmed when confirmed_at is set

  2. Purpose
     - Allow SDRs to manually confirm meetings scheduled more than 3 days out
     - Track when a meeting was confirmed
     - Improve meeting status tracking
*/

-- Ensure confirmed_at column exists
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Drop existing trigger and function to recreate them
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
    
    -- If scheduled within 3 days, auto-confirm
    IF NEW.scheduled_date <= (now() + interval '3 days') THEN
      NEW.status = 'confirmed';
      NEW.confirmed_at = now();
    END IF;
  END IF;

  -- Handle status changes
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status = 'pending') THEN
    -- If status changed to confirmed, set confirmed_at if not already set
    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at = now();
    END IF;
  ELSIF NEW.status = 'pending' AND OLD.status = 'confirmed' THEN
    -- If status changed from confirmed to pending, clear confirmed_at
    NEW.confirmed_at = NULL;
  END IF;

  -- Handle confirmed_at changes
  IF NEW.confirmed_at IS NOT NULL AND (OLD IS NULL OR OLD.confirmed_at IS NULL) THEN
    -- If confirmed_at was set, ensure status is confirmed
    NEW.status = 'confirmed';
  ELSIF NEW.confirmed_at IS NULL AND OLD.confirmed_at IS NOT NULL THEN
    -- If confirmed_at was cleared, set status to pending
    NEW.status = 'pending';
  END IF;

  -- Handle held status
  IF NEW.held_at IS NOT NULL AND (OLD IS NULL OR OLD.held_at IS NULL) THEN
    -- If held_at was set, ensure status is confirmed and not no-show
    NEW.status = 'confirmed';
    NEW.no_show = false;
    -- Also set confirmed_at if not already set
    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at = now();
    END IF;
  ELSIF NEW.held_at IS NULL AND OLD.held_at IS NOT NULL THEN
    -- If held_at was cleared, check if it should be marked as no-show
    IF NEW.scheduled_date < now() THEN
      NEW.no_show = true;
      -- Don't change status if it's confirmed by other means (e.g., confirmed_at is set)
      IF NEW.confirmed_at IS NULL THEN
        NEW.status = 'pending';
      END IF;
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

-- Update existing meetings to set confirmed_at for confirmed meetings that don't have it
UPDATE meetings
SET confirmed_at = booked_at
WHERE status = 'confirmed' AND confirmed_at IS NULL;