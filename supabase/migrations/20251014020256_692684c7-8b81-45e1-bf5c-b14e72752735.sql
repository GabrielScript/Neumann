-- Atualizar função para verificar limite de desafios SIMULTÂNEOS (ativos) em vez de desafios criados hoje
CREATE OR REPLACE FUNCTION public.check_daily_challenge_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tier subscription_tier;
  v_active_challenges INTEGER;
BEGIN
  SELECT tier INTO v_tier
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- Contar desafios ATIVOS (simultâneos), não apenas criados hoje
  SELECT COUNT(*) INTO v_active_challenges
  FROM challenges
  WHERE user_id = p_user_id
    AND is_active = true;
  
  CASE v_tier
    WHEN 'free' THEN
      RETURN v_active_challenges < 1;
    WHEN 'plus_monthly' THEN
      RETURN v_active_challenges < 6;
    WHEN 'plus_annual' THEN
      RETURN true; -- ilimitado
    ELSE
      RETURN false;
  END CASE;
END;
$function$;