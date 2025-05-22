/*
  # Update compensation structures table

  1. Changes
    - Drop existing policies if they exist
    - Create new policies for compensation structures
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_public_read_compensation" ON compensation_structures;
DROP POLICY IF EXISTS "allow_manager_manage_compensation" ON compensation_structures;

-- Create commission_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_type') THEN
    CREATE TYPE commission_type AS ENUM ('per_meeting', 'goal_based');
  END IF;
END $$;

-- Create compensation_structures table if it doesn't exist
CREATE TABLE IF NOT EXISTS compensation_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sdr_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  commission_type commission_type NOT NULL DEFAULT 'per_meeting',
  meeting_rates jsonb NOT NULL DEFAULT '{"booked": 0, "held": 0}'::jsonb,
  goal_tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sdr_id)
);

-- Enable RLS if not already enabled
ALTER TABLE compensation_structures ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "allow_public_read_compensation"
  ON compensation_structures
  FOR SELECT
  USING (true);

CREATE POLICY "allow_manager_manage_compensation"
  ON compensation_structures
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_compensation_structures_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_compensation_structures_updated_at ON compensation_structures;
CREATE TRIGGER update_compensation_structures_updated_at
  BEFORE UPDATE ON compensation_structures
  FOR EACH ROW
  EXECUTE FUNCTION update_compensation_structures_updated_at();