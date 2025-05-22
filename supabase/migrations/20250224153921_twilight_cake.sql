-- Create compensation_structures table
CREATE TABLE compensation_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sdr_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  base_salary integer NOT NULL DEFAULT 0,
  tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sdr_id)
);

-- Enable RLS
ALTER TABLE compensation_structures ENABLE ROW LEVEL SECURITY;

-- Allow public read access to compensation structures
CREATE POLICY "allow_public_read_compensation"
  ON compensation_structures
  FOR SELECT
  USING (true);

-- Allow managers to manage compensation structures
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