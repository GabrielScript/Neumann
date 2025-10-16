-- CRITICAL SECURITY FIX: Subscription tier manipulation prevention
-- Drop dangerous UPDATE policy that allows users to modify their own subscription
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;

-- Create blocking policy - users CANNOT update subscriptions
-- Only service role (via edge functions/webhooks) can update
CREATE POLICY "Block user updates on subscriptions"
ON user_subscriptions FOR UPDATE
TO authenticated
USING (false);

-- CRITICAL SECURITY FIX: XP privilege escalation prevention
-- Revoke dangerous EXECUTE grant from authenticated users
REVOKE EXECUTE ON FUNCTION public.award_xp FROM authenticated;

-- Drop old function completely before recreating with new signature
DROP FUNCTION IF EXISTS public.award_xp(UUID, INTEGER, TEXT, JSONB);

-- Recreate award_xp with enhanced security and new signature
CREATE FUNCTION public.award_xp(
  _user_id UUID,
  _amount INTEGER,
  _reason TEXT,
  _metadata JSONB DEFAULT NULL,
  _caller_function TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
  current_role TEXT;
  recent_awards INTEGER;
  daily_xp INTEGER;
  user_tier subscription_tier;
BEGIN
  -- CRITICAL: Verify caller is service_role
  SELECT current_setting('role') INTO current_role;
  IF current_role != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only system can award XP (role: %)', current_role;
  END IF;

  -- Validate amount is reasonable
  IF _amount < -1000 OR _amount > 10000 THEN
    RAISE EXCEPTION 'XP amount out of bounds: %', _amount;
  END IF;

  -- Rate limiting: Check for XP spam (more than 10 awards in 1 minute)
  SELECT COUNT(*) INTO recent_awards
  FROM xp_audit_log
  WHERE user_id = _user_id
    AND created_at > NOW() - INTERVAL '1 minute';
    
  IF recent_awards > 10 THEN
    RAISE EXCEPTION 'XP award rate limit exceeded for user';
  END IF;

  -- Daily XP caps based on subscription tier
  SELECT SUM(amount) INTO daily_xp
  FROM xp_audit_log
  WHERE user_id = _user_id
    AND DATE(created_at) = CURRENT_DATE
    AND amount > 0;
    
  SELECT tier INTO user_tier
  FROM user_subscriptions
  WHERE user_id = _user_id;
  
  daily_xp := COALESCE(daily_xp, 0);
  
  -- Free tier: max 500 XP/day, Plus monthly: max 2000 XP/day
  IF user_tier = 'free' AND daily_xp + _amount > 500 THEN
    RAISE EXCEPTION 'Daily XP limit reached for free tier';
  ELSIF user_tier = 'plus_monthly' AND daily_xp + _amount > 2000 THEN
    RAISE EXCEPTION 'Daily XP limit reached for plus monthly tier';
  END IF;

  -- Get current XP
  SELECT xp INTO new_xp FROM user_stats WHERE user_id = _user_id;
  new_xp := COALESCE(new_xp, 0) + _amount;
  
  -- Prevent negative XP
  IF new_xp < 0 THEN
    new_xp := 0;
  END IF;

  -- Calculate new level
  new_level := GREATEST(1, FLOOR(SQRT(new_xp / 100.0)) + 1);

  -- Update user_stats
  UPDATE user_stats
  SET xp = new_xp,
      level = new_level,
      updated_at = NOW()
  WHERE user_id = _user_id;

  -- Enhanced audit logging with caller information
  INSERT INTO xp_audit_log (user_id, amount, reason, metadata)
  VALUES (
    _user_id, 
    _amount, 
    _reason, 
    jsonb_build_object(
      'original_metadata', _metadata,
      'caller_function', COALESCE(_caller_function, 'unknown'),
      'called_at', NOW(),
      'caller_role', current_role
    )
  );
END;
$$;

-- Ensure only service_role can execute
GRANT EXECUTE ON FUNCTION public.award_xp TO service_role;