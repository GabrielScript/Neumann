-- Conceder acesso Neumann Plus Annual ao usuário gabrielestrela8@gmail.com
UPDATE user_subscriptions
SET 
  tier = 'plus_annual',
  status = 'active',
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'gabrielestrela8@gmail.com'
);