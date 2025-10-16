-- Adicionar campo is_public na tabela communities
ALTER TABLE public.communities
ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Criar tabela para solicitações de entrada em comunidades
CREATE TABLE public.community_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies para community_join_requests
-- Usuários podem criar solicitações para comunidades privadas
CREATE POLICY "Users can create join requests"
ON public.community_join_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM communities 
    WHERE id = community_id 
    AND is_public = false
  )
);

-- Usuários podem ver suas próprias solicitações
CREATE POLICY "Users can view own requests"
ON public.community_join_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Challenge Leaders podem ver solicitações de suas comunidades
CREATE POLICY "Leaders can view community requests"
ON public.community_join_requests
FOR SELECT
TO authenticated
USING (
  get_user_community_role(auth.uid(), community_id) = 'challenger_leader'
);

-- Challenge Leaders podem atualizar solicitações (aprovar/rejeitar)
CREATE POLICY "Leaders can update requests"
ON public.community_join_requests
FOR UPDATE
TO authenticated
USING (
  get_user_community_role(auth.uid(), community_id) = 'challenger_leader'
);

-- Atualizar policy de communities para mostrar comunidades públicas
DROP POLICY IF EXISTS "Users with Plus can view communities" ON public.communities;

CREATE POLICY "Users with Plus can view public communities"
ON public.communities
FOR SELECT
TO authenticated
USING (
  has_plus_subscription(auth.uid()) 
  AND (is_public = true OR is_community_member(auth.uid(), id))
);

-- Atualizar policy de entrada em comunidades
DROP POLICY IF EXISTS "Users with Plus can join communities" ON public.community_members;

CREATE POLICY "Users with Plus can join public communities"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK (
  has_plus_subscription(auth.uid()) 
  AND auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM communities 
    WHERE id = community_id 
    AND is_public = true
  )
);

-- Challenge Leaders podem adicionar membros aprovados
CREATE POLICY "Leaders can add approved members"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_community_role(auth.uid(), community_id) = 'challenger_leader'
);