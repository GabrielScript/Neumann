-- Conceder acesso vitalício ao plano Plus Anual para gabrielestrela8@gmail.com
UPDATE user_subscriptions
SET 
  tier = 'plus_annual',
  status = 'active',
  expires_at = NULL,
  updated_at = NOW()
WHERE user_id = '28accf30-13d1-493f-826f-f0224b5d7a4d';