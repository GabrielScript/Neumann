
-- Forçar atualização do plano para os emails especificados
UPDATE public.user_subscriptions 
SET tier = 'plus_annual', 
    status = 'active', 
    expires_at = NULL,
    updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('gabrielestrela8@gmail.com', 'gabrielestrela83@gmail.com')
);
