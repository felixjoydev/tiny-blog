-- Add onboarded column to profiles table
-- This column tracks whether a user has completed their profile setup

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarded boolean DEFAULT false;

-- Update existing profiles with display_name set and bio filled
-- to mark them as onboarded (for backward compatibility)
UPDATE profiles 
SET onboarded = true 
WHERE display_name IS NOT NULL 
  AND display_name != 'New user' 
  AND bio IS NOT NULL 
  AND bio != '';

-- Add a comment to document the column
COMMENT ON COLUMN profiles.onboarded IS 'Indicates whether the user has completed the initial profile setup';
