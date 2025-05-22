/*
  # Add UUID generation function

  1. Changes
    - Add a function to generate UUIDs for new profiles
    - Ensure consistent UUID generation across the application
*/

-- Create a function to generate UUIDs
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT gen_random_uuid();
$$;