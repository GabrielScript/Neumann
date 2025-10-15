-- Remove a policy antiga que permite champions atualizar
DROP POLICY IF EXISTS "Leaders and Champions can update communities" ON public.communities;

-- Cria nova policy permitindo apenas Challenger Leaders
CREATE POLICY "Only Challenger Leaders can update communities"
ON public.communities
FOR UPDATE
USING (get_user_community_role(auth.uid(), id) = 'challenger_leader'::community_role);