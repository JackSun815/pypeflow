-- Create default agency and migrate existing data
-- This migration assigns all existing data to a default agency

-- Create default agency
INSERT INTO public.agencies (id, name, subdomain, is_active) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Agency', 'default', true);

-- Update all existing records to belong to default agency
UPDATE public.profiles SET agency_id = '00000000-0000-0000-0000-000000000000' WHERE agency_id IS NULL;
UPDATE public.clients SET agency_id = '00000000-0000-0000-0000-000000000000' WHERE agency_id IS NULL;
UPDATE public.meetings SET agency_id = '00000000-0000-0000-0000-000000000000' WHERE agency_id IS NULL;
UPDATE public.assignments SET agency_id = '00000000-0000-0000-0000-000000000000' WHERE agency_id IS NULL;
UPDATE public.commission_goal_overrides SET agency_id = '00000000-0000-0000-0000-000000000000' WHERE agency_id IS NULL;
UPDATE public.compensation_structures SET agency_id = '00000000-0000-0000-0000-000000000000' WHERE agency_id IS NULL;

-- Make agency_id columns NOT NULL after migration
ALTER TABLE public.profiles ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.meetings ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.assignments ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.commission_goal_overrides ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.compensation_structures ALTER COLUMN agency_id SET NOT NULL;
