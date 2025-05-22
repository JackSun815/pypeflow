/*
  # Add contact phone number to meetings table

  1. Changes
    - Add contact_phone column to meetings table for storing contact phone numbers
*/

-- Add contact_phone column if it doesn't exist
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS contact_phone text;