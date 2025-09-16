/*
  # Add Client Token System
  
  This migration adds client token functionality for client dashboard access.
  
  1. Changes
    - Add client_tokens table for token-based client access
    - Add indexes for performance
    - Add helper functions for token management
  
  2. Security
    - Enable RLS on client_tokens table
    - Add policies for manager access only
*/

-- Create client_tokens table
CREATE TABLE client_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  last_used_at timestamptz
);

-- Add indexes for performance
CREATE INDEX idx_client_tokens_client_id ON client_tokens(client_id);
CREATE INDEX idx_client_tokens_token ON client_tokens(token);
CREATE INDEX idx_client_tokens_active ON client_tokens(is_active);

-- Enable RLS
ALTER TABLE client_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for manager access only
CREATE POLICY "managers_can_manage_client_tokens"
  ON client_tokens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Function to generate a secure client token
CREATE OR REPLACE FUNCTION generate_client_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to create a client token
CREATE OR REPLACE FUNCTION create_client_token(
  p_client_id uuid,
  p_created_by uuid,
  p_expires_in_days integer DEFAULT 365
)
RETURNS text AS $$
DECLARE
  new_token text;
  expires_at timestamptz;
BEGIN
  -- Generate unique token
  new_token := generate_client_token();
  
  -- Calculate expiration date
  expires_at := now() + (p_expires_in_days || ' days')::interval;
  
  -- Insert the token
  INSERT INTO client_tokens (client_id, token, created_by, expires_at)
  VALUES (p_client_id, new_token, p_created_by, expires_at);
  
  RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Function to validate a client token
CREATE OR REPLACE FUNCTION validate_client_token(p_token text)
RETURNS TABLE (
  client_id uuid,
  client_name text,
  is_valid boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.client_id,
    c.name as client_name,
    (ct.is_active = true AND (ct.expires_at IS NULL OR ct.expires_at > now())) as is_valid
  FROM client_tokens ct
  JOIN clients c ON ct.client_id = c.id
  WHERE ct.token = p_token;
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate a client token
CREATE OR REPLACE FUNCTION deactivate_client_token(p_token text)
RETURNS boolean AS $$
BEGIN
  UPDATE client_tokens 
  SET is_active = false, last_used_at = now()
  WHERE token = p_token;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
