-- Remove the unique constraint on user_id to allow multiple challenges per user
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_user_id_key;

-- Optionally, add a partial unique constraint to ensure only one active challenge per user
-- This allows users to have multiple challenges but only one active at a time
CREATE UNIQUE INDEX IF NOT EXISTS challenges_user_id_active_key 
ON challenges (user_id) 
WHERE is_active = true;