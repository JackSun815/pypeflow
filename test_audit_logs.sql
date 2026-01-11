-- Test script to check audit logs setup

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
) AS table_exists;

-- 2. Check if RLS is disabled (rowsecurity should be false)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'audit_logs';

-- 3. Check if there are any audit logs
SELECT COUNT(*) as total_logs FROM public.audit_logs;

-- 4. Show recent audit logs (last 5)
SELECT 
  created_at,
  user_email,
  user_role,
  action,
  entity_type,
  status
FROM public.audit_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Test inserting a log (this should work if RLS is disabled)
INSERT INTO public.audit_logs (
  user_email,
  user_role,
  action,
  entity_type,
  status,
  agency_id
) VALUES (
  'test@test.com',
  'manager',
  'test_action',
  'test_entity',
  'success',
  (SELECT id FROM public.agencies LIMIT 1)
);

-- 6. Verify the test log was inserted
SELECT * FROM public.audit_logs 
WHERE action = 'test_action' 
ORDER BY created_at DESC 
LIMIT 1;

