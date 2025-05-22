/*
  # Update compensation structures table

  1. Changes
    - Add commission_type field to distinguish between commission structures
    - Add goal_tiers field for goal-based commission structure
    - Add meeting_rates field for per-meeting commission structure

  2. Security
    - Maintain existing RLS policies
*/

-- Add commission_type enum
CREATE TYPE commission_type AS ENUM ('per_meeting', 'goal_based');

-- Add new fields to compensation_structures
ALTER TABLE compensation_structures 
  ADD COLUMN commission_type commission_type NOT NULL DEFAULT 'per_meeting',
  ADD COLUMN meeting_rates jsonb NOT NULL DEFAULT '{"booked": 0, "held": 0}'::jsonb,
  ADD COLUMN goal_tiers jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Drop old tiers column
ALTER TABLE compensation_structures DROP COLUMN tiers;