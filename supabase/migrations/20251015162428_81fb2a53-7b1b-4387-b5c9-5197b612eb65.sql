-- Função para verificar limite de participação em comunidades
CREATE OR REPLACE FUNCTION public.check_community_member_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tier subscription_tier;
  v_community_count INTEGER;
BEGIN
  -- Buscar tier do usuário
  SELECT tier INTO v_tier
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- Contar quantas comunidades o usuário participa
  SELECT COUNT(*) INTO v_community_count
  FROM community_members
  WHERE user_id = p_user_id;
  
  CASE v_tier
    WHEN 'free' THEN
      RETURN false; -- Free não pode participar de comunidades
    WHEN 'plus_monthly' THEN
      RETURN v_community_count < 5; -- Máximo 5 comunidades
    WHEN 'plus_annual' THEN
      RETURN v_community_count < 10; -- Máximo 10 comunidades
    ELSE
      RETURN false;
  END CASE;
END;
$function$;

-- Função para verificar limite de liderança/criação de comunidades
CREATE OR REPLACE FUNCTION public.check_community_leader_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tier subscription_tier;
  v_leader_count INTEGER;
BEGIN
  -- Buscar tier do usuário
  SELECT tier INTO v_tier
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- Contar quantas comunidades o usuário lidera
  SELECT COUNT(*) INTO v_leader_count
  FROM community_members
  WHERE user_id = p_user_id
    AND role = 'challenger_leader';
  
  CASE v_tier
    WHEN 'free', 'plus_monthly' THEN
      RETURN false; -- Free e Plus Mensal não podem criar/liderar
    WHEN 'plus_annual' THEN
      RETURN v_leader_count < 5; -- Máximo 5 comunidades lideradas
    ELSE
      RETURN false;
  END CASE;
END;
$function$;