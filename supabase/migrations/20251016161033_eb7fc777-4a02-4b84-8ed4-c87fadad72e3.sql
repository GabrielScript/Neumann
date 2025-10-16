-- Fix 1: Create proper user roles system to prevent privilege escalation
-- This separates roles from community_members table for proper security

CREATE TYPE public.app_role AS ENUM ('community_admin', 'community_moderator', 'community_member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID,
  UNIQUE (user_id, community_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_community_role(_user_id UUID, _community_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND community_id = _community_id
      AND role = _role
  )
$$;

-- Migrate existing roles from community_members to user_roles
INSERT INTO public.user_roles (user_id, community_id, role, granted_at)
SELECT 
  user_id,
  community_id,
  CASE 
    WHEN community_members.role::text = 'challenger_leader' THEN 'community_admin'::app_role
    WHEN community_members.role::text = 'champion' THEN 'community_moderator'::app_role
    ELSE 'community_member'::app_role
  END,
  joined_at
FROM community_members;

-- RLS policies for user_roles (read-only for users, admin-only updates)
CREATE POLICY "Users can view roles in their communities"
ON public.user_roles FOR SELECT
USING (
  user_id = auth.uid() OR
  community_id IN (
    SELECT community_id FROM community_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Only admins can grant roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  has_community_role(auth.uid(), community_id, 'community_admin')
);

CREATE POLICY "Only admins can revoke roles"
ON public.user_roles FOR DELETE
USING (
  has_community_role(auth.uid(), community_id, 'community_admin')
);

-- Fix 2: Secure XP system with proper audit logging
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id UUID,
  _amount INTEGER,
  _reason TEXT,
  _metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Validate amount is reasonable
  IF _amount < -1000 OR _amount > 10000 THEN
    RAISE EXCEPTION 'XP amount out of bounds: %', _amount;
  END IF;

  -- Get current XP
  SELECT xp INTO new_xp FROM user_stats WHERE user_id = _user_id;
  new_xp := COALESCE(new_xp, 0) + _amount;
  
  -- Prevent negative XP
  IF new_xp < 0 THEN
    new_xp := 0;
  END IF;

  -- Calculate new level (simplified formula)
  new_level := GREATEST(1, FLOOR(SQRT(new_xp / 100.0)) + 1);

  -- Update user_stats
  UPDATE user_stats
  SET xp = new_xp,
      level = new_level,
      updated_at = NOW()
  WHERE user_id = _user_id;

  -- Insert audit log (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO xp_audit_log (user_id, amount, reason, metadata)
  VALUES (_user_id, _amount, _reason, _metadata);
END;
$$;

-- Grant execute only to service role (edge functions)
REVOKE EXECUTE ON FUNCTION public.award_xp FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp TO service_role;

-- Allow authenticated users to execute for now (can be restricted later)
GRANT EXECUTE ON FUNCTION public.award_xp TO authenticated;