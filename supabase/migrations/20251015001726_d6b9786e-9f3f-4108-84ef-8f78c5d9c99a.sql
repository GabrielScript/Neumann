-- Atualizar política RLS para permitir que Challenger Leaders e Champions editem a descrição da comunidade
DROP POLICY IF EXISTS "Creators can update their communities" ON communities;

CREATE POLICY "Leaders and Champions can update communities"
ON communities
FOR UPDATE
USING (
  get_user_community_role(auth.uid(), id) IN ('challenger_leader', 'champion')
);