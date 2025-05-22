/*
  # Enhanced Meeting History Tracking

  1. New Columns
    - Add tracking fields to meetings table:
      - `booked_at`: When the meeting was initially scheduled
      - `held_at`: When the meeting was marked as held
      - `no_show`: Whether the meeting was a no-show
      - `contact_full_name`: Contact person's name
      - `contact_email`: Contact person's email

  2. Functions
    - Add functions to manage meeting status and statistics
    - Track meeting history and performance metrics

  3. Triggers
    - Automatically update meeting status and timestamps
    - Handle no-show detection for past meetings
*/

-- Add new columns to meetings table if they don't exist
ALTER TABLE meetings 
  ADD COLUMN IF NOT EXISTS booked_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS held_at timestamptz,
  ADD COLUMN IF NOT EXISTS no_show boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_full_name text,
  ADD COLUMN IF NOT EXISTS contact_email text;

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
  -- Set initial booked_at timestamp for new meetings
  IF TG_OP = 'INSERT' THEN
    NEW.booked_at = now();
  END IF;

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

-- Create function to calculate meeting statistics
CREATE OR REPLACE FUNCTION get_sdr_meeting_stats(p_sdr_id uuid, p_start_date date, p_end_date date)
RETURNS TABLE (
  total_meetings bigint,
  held_meetings bigint,
  no_shows bigint,
  hold_rate numeric,
  average_per_day numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_meetings,
    COUNT(*) FILTER (WHERE status = 'confirmed')::bigint as held_meetings,
    COUNT(*) FILTER (WHERE no_show = true)::bigint as no_shows,
    ROUND((COUNT(*) FILTER (WHERE status = 'confirmed')::numeric / 
           NULLIF(COUNT(*)::numeric, 0) * 100), 2) as hold_rate,
    ROUND((COUNT(*)::numeric / 
           GREATEST(1, EXTRACT(days FROM p_end_date::timestamp - p_start_date::timestamp))), 2) as average_per_day
  FROM meetings
  WHERE sdr_id = p_sdr_id
    AND scheduled_date::date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;