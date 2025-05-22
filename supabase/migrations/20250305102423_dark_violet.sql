-- Drop all existing client policies
DROP POLICY IF EXISTS "Users can create and view clients" ON clients;
DROP POLICY IF EXISTS "Users can view assigned clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "allow_public_read_clients" ON clients;

-- Disable RLS on clients table
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Drop all existing assignment policies
DROP POLICY IF EXISTS "Users can manage assignments" ON assignments;
DROP POLICY IF EXISTS "Users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update assignments" ON assignments;
DROP POLICY IF EXISTS "allow_public_read_assignments" ON assignments;

-- Disable RLS on assignments table
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

-- Drop all existing meeting policies
DROP POLICY IF EXISTS "allow_public_read_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_sdr_insert_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_sdr_update_meetings" ON meetings;
DROP POLICY IF EXISTS "allow_sdr_delete_meetings" ON meetings;

-- Disable RLS on meetings table
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;