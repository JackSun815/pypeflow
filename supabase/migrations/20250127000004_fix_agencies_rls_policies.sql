-- Fix RLS policies for agencies table to allow super admins to create/update agencies

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to active agencies" ON public.agencies;
DROP POLICY IF EXISTS "Allow authenticated users to read agencies" ON public.agencies;

-- Create comprehensive RLS policies for agencies table

-- Allow public read access to active agencies (needed for subdomain resolution)
CREATE POLICY "Allow public read access to active agencies" ON public.agencies
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to read all agencies (for super admin interface)
CREATE POLICY "Allow authenticated users to read agencies" ON public.agencies
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow super admins to insert new agencies
CREATE POLICY "Allow super admins to create agencies" ON public.agencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.super_admin = true
    )
  );

-- Allow super admins to update agencies
CREATE POLICY "Allow super admins to update agencies" ON public.agencies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.super_admin = true
    )
  );

-- Allow super admins to delete agencies (optional - for future use)
CREATE POLICY "Allow super admins to delete agencies" ON public.agencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.super_admin = true
    )
  );
