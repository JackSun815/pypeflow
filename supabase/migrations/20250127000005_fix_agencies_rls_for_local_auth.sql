-- Fix RLS policies for agencies table to work with localStorage-based authentication
-- Since we're not using Supabase Auth, we need to disable RLS or use service role

-- Option 1: Disable RLS for agencies table (simplest solution)
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, use service role bypass
-- Uncomment the following lines if you want to keep RLS enabled:

-- DROP POLICY IF EXISTS "Allow public read access to active agencies" ON public.agencies;
-- DROP POLICY IF EXISTS "Allow authenticated users to read agencies" ON public.agencies;
-- DROP POLICY IF EXISTS "Allow super admins to create agencies" ON public.agencies;
-- DROP POLICY IF EXISTS "Allow super admins to update agencies" ON public.agencies;
-- DROP POLICY IF EXISTS "Allow super admins to delete agencies" ON public.agencies;

-- -- Allow all operations for service role (bypasses RLS)
-- CREATE POLICY "Allow service role full access" ON public.agencies
--   FOR ALL USING (auth.role() = 'service_role');

-- -- Allow public read access to active agencies
-- CREATE POLICY "Allow public read access to active agencies" ON public.agencies
--   FOR SELECT USING (is_active = true);
