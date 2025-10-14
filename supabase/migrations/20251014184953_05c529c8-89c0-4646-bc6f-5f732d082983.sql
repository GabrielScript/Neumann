-- Add difficulty field to challenges table
ALTER TABLE challenges 
ADD COLUMN difficulty integer CHECK (difficulty >= 1 AND difficulty <= 5);

-- Add happiness_level field to challenge_items table
ALTER TABLE challenge_items 
ADD COLUMN happiness_level integer CHECK (happiness_level >= 1 AND happiness_level <= 10);

-- Update existing records to have default values (optional, can be NULL)
UPDATE challenges SET difficulty = 3 WHERE difficulty IS NULL;
UPDATE challenge_items SET happiness_level = 5 WHERE happiness_level IS NULL;