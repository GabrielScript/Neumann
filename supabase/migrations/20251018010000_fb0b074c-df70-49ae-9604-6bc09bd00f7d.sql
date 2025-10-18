-- Create a function to reset user subscription to free tier
CREATE OR REPLACE FUNCTION public.reset_to_free_tier(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_subscriptions
  SET tier = 'free',
      status = 'active',
      stripe_subscription_id = NULL,
      stripe_customer_id = NULL,
      expires_at = NULL,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Execute the function for the current user
SELECT reset_to_free_tier('28accf30-13d1-493f-826f-f0224b5d7a4d');