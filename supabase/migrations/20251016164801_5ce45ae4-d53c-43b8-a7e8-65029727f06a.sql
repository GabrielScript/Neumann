-- Create feedback_log table for rate limiting and audit
CREATE TABLE IF NOT EXISTS public.feedback_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback history
CREATE POLICY "Users can view own feedback"
  ON public.feedback_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (via edge function)
CREATE POLICY "Service role can insert feedback"
  ON public.feedback_log
  FOR INSERT
  WITH CHECK (true);

-- Create index for rate limiting queries
CREATE INDEX idx_feedback_log_user_created 
  ON public.feedback_log(user_id, created_at DESC);