/*
  # Initial Schema for SDR Meeting Tracking App

  1. New Tables
    - `profiles`
      - Extends Supabase auth.users with role information
      - Links to clients through assignments
    - `clients`
      - Stores client information
      - Has monthly meeting targets
    - `assignments`
      - Links SDRs to their assigned clients
      - Tracks monthly targets
    - `meetings`
      - Stores all booked meetings
      - Includes status (pending/confirmed)
      - Links to SDR and client

  2. Security
    - Enable RLS on all tables
    - Policies for SDR access to their own data
    - Policies for manager access to all data
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('sdr', 'manager');

-- Create enum for meeting status
CREATE TYPE meeting_status AS ENUM ('pending', 'confirmed');

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'sdr',
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assignments table
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sdr_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  monthly_target integer NOT NULL DEFAULT 0,
  month date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sdr_id, client_id, month)
);

-- Create meetings table
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sdr_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  booked_at timestamptz DEFAULT now(),
  status meeting_status DEFAULT 'pending',
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Clients policies
CREATE POLICY "SDRs can view assigned clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE sdr_id = auth.uid() AND client_id = clients.id
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Assignments policies
CREATE POLICY "SDRs can view their assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    sdr_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Meetings policies
CREATE POLICY "SDRs can CRUD their own meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (
    sdr_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION get_month_progress(target_month date)
RETURNS float AS $$
DECLARE
  days_in_month integer;
  days_passed integer;
BEGIN
  days_in_month := EXTRACT(days FROM DATE_TRUNC('month', target_month) + INTERVAL '1 month - 1 day');
  days_passed := LEAST(EXTRACT(day FROM CURRENT_DATE), days_in_month);
  RETURN (days_passed::float / days_in_month::float) * 100;
END;
$$ LANGUAGE plpgsql;