/*
  # Add monthly target to clients table

  1. Changes
    - Add `monthly_target` column to `clients` table
      - Type: integer
      - Not null
      - Default value: 0
*/

ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_target integer NOT NULL DEFAULT 0;