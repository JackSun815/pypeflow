-- Comprehensive SQL to fix SDR active toggle
-- Run this in your Supabase SQL Editor

-- STEP 1: Check if 'active' column exists in profiles table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'active';

-- STEP 2: If the column doesn't exist, create it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'active'
    ) THEN
        ALTER TABLE profiles ADD COLUMN active BOOLEAN DEFAULT true;
        COMMENT ON COLUMN profiles.active IS 'Whether the SDR/Manager account is active';
        
        -- Set all existing profiles to active by default
        UPDATE profiles SET active = true WHERE active IS NULL;
    END IF;
END $$;

-- STEP 3: Drop any existing policies
DROP POLICY IF EXISTS "Managers can update SDR active status in their agency" ON profiles;
DROP POLICY IF EXISTS "Managers can update profiles in their agency" ON profiles;

-- STEP 4: Check existing UPDATE policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

-- STEP 5: Create a more permissive policy for managers to update profiles
CREATE POLICY "Managers can update profiles in their agency"
ON profiles
FOR UPDATE
TO authenticated
USING (
  -- Check if the current user is a manager
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
      AND p.role = 'manager'
      AND p.agency_id = profiles.agency_id
  )
)
WITH CHECK (
  -- Same check for updates
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
      AND p.role = 'manager'
      AND p.agency_id = profiles.agency_id
  )
);

-- STEP 6: Alternative approach using a secure function
-- This bypasses RLS and runs with elevated permissions
CREATE OR REPLACE FUNCTION toggle_sdr_active(sdr_id uuid, new_active_status boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the permissions of the creator
SET search_path = public
AS $$
DECLARE
  current_user_role text;
  current_user_agency uuid;
  target_sdr_role text;
  target_sdr_agency uuid;
  result json;
BEGIN
  -- Get current user's role and agency
  SELECT role, agency_id INTO current_user_role, current_user_agency
  FROM profiles
  WHERE id = auth.uid();

  -- Check if current user is a manager
  IF current_user_role != 'manager' THEN
    RAISE EXCEPTION 'Only managers can toggle SDR active status';
  END IF;

  -- Get target SDR's role and agency
  SELECT role, agency_id INTO target_sdr_role, target_sdr_agency
  FROM profiles
  WHERE id = sdr_id;

  -- Check if target is an SDR
  IF target_sdr_role != 'sdr' THEN
    RAISE EXCEPTION 'Can only toggle active status for SDRs';
  END IF;

  -- Check if both are in the same agency
  IF current_user_agency != target_sdr_agency THEN
    RAISE EXCEPTION 'Can only toggle SDRs in your own agency';
  END IF;

  -- Update the active status
  UPDATE profiles
  SET active = new_active_status,
      updated_at = now()
  WHERE id = sdr_id;

  -- Return success
  SELECT json_build_object(
    'success', true,
    'sdr_id', sdr_id,
    'active', new_active_status,
    'message', CASE 
      WHEN new_active_status THEN 'SDR reactivated successfully'
      ELSE 'SDR deactivated successfully'
    END
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION toggle_sdr_active(uuid, boolean) TO authenticated;

-- STEP 7: Verify the function was created
SELECT proname, proargtypes, prosecdef 
FROM pg_proc 
WHERE proname = 'toggle_sdr_active';

-- STEP 8: Test the function (optional - replace with actual IDs to test)
-- SELECT toggle_sdr_active('your-sdr-id-here', false);

COMMENT ON FUNCTION toggle_sdr_active IS 'Allows managers to toggle SDR active status within their agency. This function uses SECURITY DEFINER to bypass RLS.';

