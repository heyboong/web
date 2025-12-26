-- Add admin column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN admin BOOLEAN DEFAULT FALSE;
