-- Add commission goal overrides table
-- This allows managers to set custom commission goals for SDRs that override the calculated goal

-- First, let's check if the profiles table exists and create the table
DO $$ 
BEGIN
    -- Check if profiles table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Create the commission goal overrides table
        CREATE TABLE IF NOT EXISTS commission_goal_overrides (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            sdr_id uuid,
            commission_goal integer NOT NULL DEFAULT 0,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            UNIQUE(sdr_id)
        );

        -- Add foreign key constraint if it doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'commission_goal_overrides_sdr_id_fkey'
        ) THEN
            ALTER TABLE commission_goal_overrides 
            ADD CONSTRAINT commission_goal_overrides_sdr_id_fkey 
            FOREIGN KEY (sdr_id) REFERENCES profiles(id) ON DELETE CASCADE;
        END IF;
    ELSE
        RAISE EXCEPTION 'Profiles table does not exist. Please run the initial migration first.';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE commission_goal_overrides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Managers can view all commission goal overrides" ON commission_goal_overrides;
DROP POLICY IF EXISTS "Managers can insert commission goal overrides" ON commission_goal_overrides;
DROP POLICY IF EXISTS "Managers can update commission goal overrides" ON commission_goal_overrides;
DROP POLICY IF EXISTS "Managers can delete commission goal overrides" ON commission_goal_overrides;

-- Create policies for commission goal overrides
CREATE POLICY "Managers can view all commission goal overrides"
  ON commission_goal_overrides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Managers can insert commission goal overrides"
  ON commission_goal_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Managers can update commission goal overrides"
  ON commission_goal_overrides
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Managers can delete commission goal overrides"
  ON commission_goal_overrides
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  ); 