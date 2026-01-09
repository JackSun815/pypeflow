-- Create audit_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- User information
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  
  -- Agency information for multi-tenant isolation
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Action details
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  
  -- Change details
  changes jsonb,
  old_values jsonb,
  new_values jsonb,
  
  -- Request metadata
  ip_address text,
  user_agent text,
  
  -- Additional context
  metadata jsonb,
  status text DEFAULT 'success' CHECK (status IN ('success', 'error', 'warning'))
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_agency_id ON public.audit_logs(agency_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_agency_created ON public.audit_logs(agency_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Managers can view all audit logs for their agency
CREATE POLICY "Managers can view agency audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT agency_id 
      FROM public.sdrs 
      WHERE user_id = auth.uid() 
      AND role = 'manager'
    )
  );

-- Policy: SDRs can view their own audit logs
CREATE POLICY "SDRs can view own audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    agency_id IN (
      SELECT agency_id 
      FROM public.sdrs 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can insert audit logs (for system operations)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.audit_logs IS 'Audit trail for tracking all user actions and system events';
