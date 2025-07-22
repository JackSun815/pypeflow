-- Add timezone column to meetings table for multi-timezone support
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS timezone text; 