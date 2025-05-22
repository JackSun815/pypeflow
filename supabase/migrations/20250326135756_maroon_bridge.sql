/*
  # Fix meeting dates to include time

  1. Changes
    - Modify scheduled_date column to use timestamptz instead of date
    - Update trigger function to handle timestamptz
*/

-- First, create a temporary column
ALTER TABLE meetings ADD COLUMN scheduled_datetime timestamptz;

-- Copy data from scheduled_date to scheduled_datetime, preserving the time component
UPDATE meetings 
SET scheduled_datetime = scheduled_date::timestamptz;

-- Drop the old column
ALTER TABLE meetings DROP COLUMN scheduled_date;

-- Rename the new column
ALTER TABLE meetings RENAME COLUMN scheduled_datetime TO scheduled_date;

-- Update the trigger function
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
    NEW.confirmed_at = now();
  END IF;

  -- Handle held status
  IF NEW.held_at IS NOT NULL AND (OLD IS NULL OR OLD.held_at IS NULL) THEN
    NEW.status = 'confirmed';
    NEW.no_show = false;
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