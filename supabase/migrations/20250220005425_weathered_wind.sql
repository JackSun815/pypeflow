-- Drop all existing profile policies
DROP POLICY IF EXISTS "view_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "create_profile" ON profiles;
DROP POLICY IF EXISTS "manager_view_all" ON profiles;

-- Create a function to check if a user is a manager
CREATE OR REPLACE FUNCTION is_user_manager(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow all authenticated users to view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    is_user_manager(auth.uid())
  );

-- Allow all authenticated users to update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow profile creation during signup
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());