-- Create client_monthly_targets table for month-specific client targets
-- This allows each month to have its own client targets, independent of other months

CREATE TABLE IF NOT EXISTS public.client_monthly_targets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Client and month information
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  month text NOT NULL, -- Format: YYYY-MM (e.g., '2026-01')
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  
  -- Month-specific targets
  monthly_set_target integer NOT NULL DEFAULT 0,
  monthly_hold_target integer NOT NULL DEFAULT 0,
  
  -- Ensure one target record per client per month
  UNIQUE(client_id, month, agency_id)
);

-- Create indexes for common queries (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_client_monthly_targets_client_id ON public.client_monthly_targets(client_id);
CREATE INDEX IF NOT EXISTS idx_client_monthly_targets_month ON public.client_monthly_targets(month);
CREATE INDEX IF NOT EXISTS idx_client_monthly_targets_agency_id ON public.client_monthly_targets(agency_id);
CREATE INDEX IF NOT EXISTS idx_client_monthly_targets_client_month ON public.client_monthly_targets(client_id, month);

-- Disable RLS on client_monthly_targets table (managers use localStorage auth, not Supabase auth)
ALTER TABLE public.client_monthly_targets DISABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON TABLE public.client_monthly_targets IS 'Month-specific targets for clients. Each client can have different targets for each month.';

