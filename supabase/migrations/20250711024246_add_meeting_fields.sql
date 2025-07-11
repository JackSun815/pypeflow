/*
  # Add missing fields to meetings table

  1. Changes
    - Add company field to meetings table
    - Add linkedin_page field to meetings table  
    - Add notes field to meetings table

  2. Purpose
    - Support additional meeting details for better tracking
    - Fix TypeScript errors related to missing fields
*/

-- Add new columns to meetings table
ALTER TABLE meetings 
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS linkedin_page text,
  ADD COLUMN IF NOT EXISTS notes text;
