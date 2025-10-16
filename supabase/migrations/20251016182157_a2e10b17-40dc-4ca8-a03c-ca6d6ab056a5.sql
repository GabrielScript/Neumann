-- Criar função para calcular multiplicador de XP baseado no ranking
CREATE OR REPLACE FUNCTION public.get_xp_multiplier(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_position INTEGER;
  multiplier NUMERIC := 1.0;
BEGIN
  -- Obter posição do usuário no ranking de level
  SELECT position INTO user_position
  FROM (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY level DESC, xp DESC) as position
    FROM user_stats
  ) ranked
  WHERE user_id = _user_id;
  
  -- Aplicar multiplicador baseado na posição
  IF user_position = 1 THEN
    multiplier := 1.10; -- +10%
  ELSIF user_position = 2 THEN
    multiplier := 1.075; -- +7.5%
  ELSIF user_position = 3 THEN
    multiplier := 1.05; -- +5%
  ELSIF user_position >= 4 AND user_position <= 10 THEN
    multiplier := 1.025; -- +2.5%
  END IF;
  
  RETURN multiplier;
END;
$$;

-- Atualizar função award_xp para usar multiplicador de ranking
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount integer, _reason text, _metadata jsonb DEFAULT NULL::jsonb, _caller_function text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
  current_role TEXT;
  recent_awards INTEGER;
  daily_xp INTEGER;
  user_tier subscription_tier;
  xp_multiplier NUMERIC;
  final_amount INTEGER;
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

  -- Obter multiplicador de XP baseado no ranking (somente para XP positivo)
  IF _amount > 0 THEN
    xp_multiplier := get_xp_multiplier(_user_id);
    final_amount := FLOOR(_amount * xp_multiplier);
  ELSE
    final_amount := _amount;
  END IF;

  -- Get current XP
  SELECT xp INTO new_xp FROM user_stats WHERE user_id = _user_id;
  new_xp := COALESCE(new_xp, 0) + final_amount;
  
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

  -- Enhanced audit logging with caller information and multiplier
  INSERT INTO xp_audit_log (user_id, amount, reason, metadata)
  VALUES (
    _user_id, 
    final_amount, 
    _reason, 
    jsonb_build_object(
      'original_amount', _amount,
      'multiplier', xp_multiplier,
      'original_metadata', _metadata,
      'caller_function', COALESCE(_caller_function, 'unknown'),
      'called_at', NOW(),
      'caller_role', current_role
    )
  );
END;
$$;