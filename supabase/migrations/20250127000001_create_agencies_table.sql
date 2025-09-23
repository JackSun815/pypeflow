-- Create agencies table for multi-tenant support
CREATE TABLE public.agencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  CONSTRAINT agencies_pkey PRIMARY KEY (id)
);

-- Create index for subdomain lookups
CREATE INDEX idx_agencies_subdomain ON public.agencies(subdomain);
CREATE INDEX idx_agencies_active ON public.agencies(is_active);

-- Add RLS policies for agencies table
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active agencies (needed for subdomain resolution)
CREATE POLICY "Allow public read access to active agencies" ON public.agencies
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to read all agencies (for super admin)
CREATE POLICY "Allow authenticated users to read agencies" ON public.agencies
  FOR SELECT USING (auth.role() = 'authenticated');
