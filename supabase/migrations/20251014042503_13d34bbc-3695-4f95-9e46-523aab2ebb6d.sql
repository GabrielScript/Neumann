-- Add audit logging table for XP awards
CREATE TABLE IF NOT EXISTS public.xp_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.xp_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.xp_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add database constraints for data integrity
ALTER TABLE public.user_stats 
  DROP CONSTRAINT IF EXISTS positive_xp,
  DROP CONSTRAINT IF EXISTS positive_level,
  DROP CONSTRAINT IF EXISTS positive_streak,
  DROP CONSTRAINT IF EXISTS positive_medals;

ALTER TABLE public.user_stats 
  ADD CONSTRAINT positive_xp CHECK (xp >= 0),
  ADD CONSTRAINT positive_level CHECK (level >= 1),
  ADD CONSTRAINT positive_streak CHECK (current_streak >= 0 AND best_streak >= 0),
  ADD CONSTRAINT positive_medals CHECK (
    daily_medals_bronze >= 0 AND 
    daily_medals_silver >= 0 AND 
    daily_medals_gold >= 0 AND
    life_goal_trophies >= 0
  );

-- Add index for audit log queries
CREATE INDEX IF NOT EXISTS idx_xp_audit_user_created 
  ON public.xp_audit_log(user_id, created_at DESC);

-- Add index for challenge progress queries (performance)
CREATE INDEX IF NOT EXISTS idx_challenge_progress_lookup
  ON public.challenge_progress(challenge_id, item_id, date);

-- Add index for daily medals
CREATE INDEX IF NOT EXISTS idx_daily_medals_lookup
  ON public.daily_medals(user_id, date DESC);