-- Fix infinite recursion by creating a security definer function
CREATE OR REPLACE FUNCTION public.is_community_member(p_user_id UUID, p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM community_members
    WHERE user_id = p_user_id 
    AND community_id = p_community_id
  );
$$;

-- Drop and recreate the problematic policy
DROP POLICY IF EXISTS "Members can view other members in their communities" ON public.community_members;

CREATE POLICY "Members can view other members in their communities"
ON public.community_members
FOR SELECT
TO authenticated
USING (public.is_community_member(auth.uid(), community_id));

-- Insert missing subscriptions for existing users
INSERT INTO public.user_subscriptions (user_id, tier, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions)
ON CONFLICT (user_id) DO NOTHING;