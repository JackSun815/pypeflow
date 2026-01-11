-- Fix RLS on audit_logs table
-- This will disable RLS so managers using localStorage auth can insert logs

ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'audit_logs';

