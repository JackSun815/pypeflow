-- Add agency_id columns to all main tables for multi-tenant support

-- Add agency_id to profiles table
ALTER TABLE public.profiles ADD COLUMN agency_id uuid;

-- Add agency_id to clients table  
ALTER TABLE public.clients ADD COLUMN agency_id uuid;

-- Add agency_id to meetings table
ALTER TABLE public.meetings ADD COLUMN agency_id uuid;

-- Add agency_id to assignments table
ALTER TABLE public.assignments ADD COLUMN agency_id uuid;

-- Add agency_id to commission_goal_overrides table
ALTER TABLE public.commission_goal_overrides ADD COLUMN agency_id uuid;

-- Add agency_id to compensation_structures table
ALTER TABLE public.compensation_structures ADD COLUMN agency_id uuid;

-- Create indexes for performance
CREATE INDEX idx_profiles_agency_id ON public.profiles(agency_id);
CREATE INDEX idx_clients_agency_id ON public.clients(agency_id);
CREATE INDEX idx_meetings_agency_id ON public.meetings(agency_id);
CREATE INDEX idx_assignments_agency_id ON public.assignments(agency_id);
CREATE INDEX idx_commission_goal_overrides_agency_id ON public.commission_goal_overrides(agency_id);
CREATE INDEX idx_compensation_structures_agency_id ON public.compensation_structures(agency_id);

-- Add foreign key constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_agency_id_fkey 
  FOREIGN KEY (agency_id) REFERENCES public.agencies(id);

ALTER TABLE public.clients ADD CONSTRAINT clients_agency_id_fkey 
  FOREIGN KEY (agency_id) REFERENCES public.agencies(id);

ALTER TABLE public.meetings ADD CONSTRAINT meetings_agency_id_fkey 
  FOREIGN KEY (agency_id) REFERENCES public.agencies(id);

ALTER TABLE public.assignments ADD CONSTRAINT assignments_agency_id_fkey 
  FOREIGN KEY (agency_id) REFERENCES public.agencies(id);

ALTER TABLE public.commission_goal_overrides ADD CONSTRAINT commission_goal_overrides_agency_id_fkey 
  FOREIGN KEY (agency_id) REFERENCES public.agencies(id);

ALTER TABLE public.compensation_structures ADD CONSTRAINT compensation_structures_agency_id_fkey 
  FOREIGN KEY (agency_id) REFERENCES public.agencies(id);
