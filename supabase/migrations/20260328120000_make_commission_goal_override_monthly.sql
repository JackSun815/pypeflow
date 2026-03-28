-- Make commission goal overrides month-specific per SDR
-- New uniqueness: one override per SDR per month

ALTER TABLE public.commission_goal_overrides
ADD COLUMN IF NOT EXISTS month text;

-- Backfill existing rows to the current month key so old data remains valid.
UPDATE public.commission_goal_overrides
SET month = to_char(now(), 'YYYY-MM')
WHERE month IS NULL;

ALTER TABLE public.commission_goal_overrides
ALTER COLUMN month SET NOT NULL;

-- Replace old unique constraint on sdr_id with monthly uniqueness.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'commission_goal_overrides'
      AND constraint_name = 'commission_goal_overrides_sdr_id_key'
  ) THEN
    ALTER TABLE public.commission_goal_overrides
    DROP CONSTRAINT commission_goal_overrides_sdr_id_key;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'commission_goal_overrides'
      AND constraint_name = 'commission_goal_overrides_sdr_id_month_key'
  ) THEN
    ALTER TABLE public.commission_goal_overrides
    ADD CONSTRAINT commission_goal_overrides_sdr_id_month_key UNIQUE (sdr_id, month);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_commission_goal_overrides_sdr_month
ON public.commission_goal_overrides (sdr_id, month);
