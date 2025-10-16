-- Atualizar função get_xp_multiplier com novos valores
CREATE OR REPLACE FUNCTION public.get_xp_multiplier(_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_position INTEGER;
  user_tier subscription_tier;
  multiplier NUMERIC := 1.0;
BEGIN
  -- Obter tier do usuário
  SELECT tier INTO user_tier
  FROM user_subscriptions
  WHERE user_id = _user_id;
  
  -- Aplicar multiplicador base por tier
  CASE user_tier
    WHEN 'plus_monthly' THEN
      multiplier := 1.015; -- +1.5% turbo XP
    WHEN 'plus_annual' THEN
      multiplier := 1.025; -- +2.5% turbo XP
    ELSE
      multiplier := 1.0;
  END CASE;
  
  -- Obter posição do usuário no ranking de level
  SELECT position INTO user_position
  FROM (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY level DESC, xp DESC) as position
    FROM user_stats
  ) ranked
  WHERE user_id = _user_id;
  
  -- Aplicar multiplicador adicional baseado na posição (acumulativo)
  IF user_position = 1 THEN
    multiplier := multiplier + 0.10; -- +10% adicional
  ELSIF user_position = 2 THEN
    multiplier := multiplier + 0.075; -- +7.5% adicional
  ELSIF user_position = 3 THEN
    multiplier := multiplier + 0.05; -- +5% adicional
  ELSIF user_position >= 4 AND user_position <= 10 THEN
    multiplier := multiplier + 0.03; -- +3% adicional (atualizado)
  END IF;
  
  RETURN multiplier;
END;
$function$;