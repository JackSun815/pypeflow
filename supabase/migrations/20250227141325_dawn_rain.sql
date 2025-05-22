/*
  # Fix meetings table schema

  1. Changes
     - Add missing confirmed_at column to meetings table
     - Ensure all required columns exist with proper types
     - Update trigger function to handle confirmed_at properly

  2. Purpose
     - Fix errors when adding or fetching meetings
     - Ensure consistent schema across all environments
*/

-- Add confirmed_at column if it doesn't exist
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Ensure other required columns exist
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS held_at timestamptz;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS no_show boolean DEFAULT false;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS contact_full_name text;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS contact_email text;

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
    NEW.confirmed_at = now();
  END IF;

  -- Handle held status
  IF NEW.held_at IS NOT NULL AND OLD.held_at IS NULL THEN
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

-- Create trigger for meeting status updates
CREATE TRIGGER update_meeting_status
  BEFORE INSERT OR UPDATE OF status, held_at ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_status();

-- Update existing meetings to set confirmed_at for confirmed meetings
UPDATE meetings
SET confirmed_at = booked_at
WHERE status = 'confirmed' AND confirmed_at IS NULL;