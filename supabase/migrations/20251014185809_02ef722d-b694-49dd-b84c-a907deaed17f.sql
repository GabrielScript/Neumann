-- Add challenges_completed column to user_stats table
ALTER TABLE public.user_stats 
ADD COLUMN challenges_completed integer NOT NULL DEFAULT 0;

-- Update existing records with current count of completed challenges
UPDATE public.user_stats us
SET challenges_completed = (
  SELECT COUNT(*)
  FROM public.challenges c
  WHERE c.user_id = us.user_id
  AND c.completed_at IS NOT NULL
);