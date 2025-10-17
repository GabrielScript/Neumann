-- Conceder acesso vitalício ao plano Neumann Plus Anual para emails específicos
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Processar cada email
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE email IN ('gabrielestrela8@gmail.com', 'gabrielestrela83@gmail.com')
  LOOP
    -- Atualizar ou inserir subscription
    INSERT INTO public.user_subscriptions (user_id, tier, status, expires_at)
    VALUES (user_record.id, 'plus_annual', 'active', NULL)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      tier = 'plus_annual',
      status = 'active',
      expires_at = NULL,
      updated_at = NOW();
  END LOOP;
END $$;