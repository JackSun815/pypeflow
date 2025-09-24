-- Fix RLS policies for agency isolation

-- Drop existing policies that don't enforce agency isolation
DROP POLICY IF EXISTS "view_profiles" ON profiles;
DROP POLICY IF EXISTS "update_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_profiles" ON profiles;
DROP POLICY IF EXISTS "delete_profiles" ON profiles;

-- Create agency-aware policies for profiles table

-- Policy for viewing profiles - users can only see profiles from their agency
CREATE POLICY "view_profiles_agency_isolated"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile
    id = auth.uid() 
    OR 
    -- Managers can view profiles from their agency
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'manager'
        AND profiles.active = true
      )
      AND agency_id = (
        SELECT agency_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
    OR
    -- Super admins can view all profiles
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.super_admin = true
      )
    )
  );

-- Policy for updating profiles - agency isolated
CREATE POLICY "update_profiles_agency_isolated"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own profile
    id = auth.uid() 
    OR 
    -- Managers can update SDR profiles in their agency
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'manager'
        AND profiles.active = true
      )
      AND role = 'sdr'
      AND agency_id = (
        SELECT agency_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
    OR
    -- Super admins can update any profile
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.super_admin = true
      )
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    id = auth.uid() 
    OR 
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'manager'
        AND profiles.active = true
      )
      AND role = 'sdr'
      AND agency_id = (
        SELECT agency_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.super_admin = true
      )
    )
  );

-- Policy for inserting profiles - agency isolated
CREATE POLICY "insert_profiles_agency_isolated"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can create their own profile
    id = auth.uid() 
    OR 
    -- Managers can create SDR profiles in their agency
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'manager'
        AND profiles.active = true
      )
      AND role = 'sdr'
      AND agency_id = (
        SELECT agency_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
    OR
    -- Super admins can create any profile
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.super_admin = true
      )
    )
  );

-- Policy for deleting profiles (soft delete via active flag) - agency isolated
CREATE POLICY "delete_profiles_agency_isolated"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Managers can deactivate SDR profiles in their agency
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'manager'
        AND profiles.active = true
      )
      AND role = 'sdr'
      AND agency_id = (
        SELECT agency_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
    OR
    -- Super admins can deactivate any profile
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.super_admin = true
      )
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'manager'
        AND profiles.active = true
      )
      AND role = 'sdr'
      AND agency_id = (
        SELECT agency_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.super_admin = true
      )
    )
  );
