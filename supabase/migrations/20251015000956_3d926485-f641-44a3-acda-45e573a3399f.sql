-- Atualizar política RLS para permitir que Challenger Leaders excluam comunidades
DROP POLICY IF EXISTS "Creators can delete their communities" ON communities;

CREATE POLICY "Challenger Leaders can delete communities"
ON communities
FOR DELETE
USING (
  get_user_community_role(auth.uid(), id) = 'challenger_leader'
);