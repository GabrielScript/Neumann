-- Create enum for community roles
CREATE TYPE public.community_role AS ENUM ('challenger_leader', 'champion', 'novice');

-- Create communities table
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create community_members table
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role public.community_role NOT NULL DEFAULT 'novice',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community_challenges table
CREATE TABLE public.community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.challenge_templates(id) NOT NULL,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMPTZ
);

-- Create community_chat_messages table
CREATE TABLE public.community_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_chat_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user can create community (Plus Annual only)
CREATE OR REPLACE FUNCTION public.can_create_community(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tier = 'plus_annual' 
  FROM user_subscriptions 
  WHERE user_id = p_user_id AND status = 'active';
$$;

-- Security definer function to check leader limit (max 3 per community)
CREATE OR REPLACE FUNCTION public.check_leader_limit(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < 3 
  FROM community_members 
  WHERE community_id = p_community_id 
  AND role = 'challenger_leader';
$$;

-- Security definer function to get user's role in a community
CREATE OR REPLACE FUNCTION public.get_user_community_role(p_user_id UUID, p_community_id UUID)
RETURNS public.community_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM community_members 
  WHERE user_id = p_user_id 
  AND community_id = p_community_id;
$$;

-- Security definer function to check if user has Plus subscription
CREATE OR REPLACE FUNCTION public.has_plus_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tier IN ('plus_monthly', 'plus_annual')
  FROM user_subscriptions 
  WHERE user_id = p_user_id AND status = 'active';
$$;

-- RLS Policies for communities table
CREATE POLICY "Users with Plus can view communities"
ON public.communities
FOR SELECT
TO authenticated
USING (public.has_plus_subscription(auth.uid()));

CREATE POLICY "Users with Plus Annual can create communities"
ON public.communities
FOR INSERT
TO authenticated
WITH CHECK (public.can_create_community(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Creators can update their communities"
ON public.communities
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their communities"
ON public.communities
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- RLS Policies for community_members table
CREATE POLICY "Members can view other members in their communities"
ON public.community_members
FOR SELECT
TO authenticated
USING (
  community_id IN (
    SELECT community_id 
    FROM community_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users with Plus can join communities"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_plus_subscription(auth.uid()) 
  AND auth.uid() = user_id
);

CREATE POLICY "Leaders can update member roles"
ON public.community_members
FOR UPDATE
TO authenticated
USING (
  public.get_user_community_role(auth.uid(), community_id) = 'challenger_leader'
);

CREATE POLICY "Users can leave communities"
ON public.community_members
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.get_user_community_role(auth.uid(), community_id) = 'challenger_leader'
);

-- RLS Policies for community_challenges table
CREATE POLICY "Members can view challenges in their communities"
ON public.community_challenges
FOR SELECT
TO authenticated
USING (
  is_global = true
  OR community_id IN (
    SELECT community_id 
    FROM community_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Champions and Leaders can create challenges"
ON public.community_challenges
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    is_global = false AND public.get_user_community_role(auth.uid(), community_id) IN ('champion', 'challenger_leader')
    OR is_global = true AND public.can_create_community(auth.uid())
  )
);

CREATE POLICY "Leaders can update challenges"
ON public.community_challenges
FOR UPDATE
TO authenticated
USING (
  public.get_user_community_role(auth.uid(), community_id) = 'challenger_leader'
);

CREATE POLICY "Creators and Leaders can delete challenges"
ON public.community_challenges
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by 
  OR public.get_user_community_role(auth.uid(), community_id) = 'challenger_leader'
);

-- RLS Policies for community_chat_messages table
CREATE POLICY "Members can view messages in their communities"
ON public.community_chat_messages
FOR SELECT
TO authenticated
USING (
  community_id IN (
    SELECT community_id 
    FROM community_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can send messages"
ON public.community_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND community_id IN (
    SELECT community_id 
    FROM community_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own messages"
ON public.community_chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_chat_messages;

-- Create trigger for updated_at on communities
CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON public.communities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();