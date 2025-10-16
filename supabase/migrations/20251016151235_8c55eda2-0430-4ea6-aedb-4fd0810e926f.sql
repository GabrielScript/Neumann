-- Modificar tabela direct_messages para permitir community_id NULL (mensagens globais)
ALTER TABLE public.direct_messages
ALTER COLUMN community_id DROP NOT NULL;

-- Criar índice para melhorar performance de queries sem community_id
CREATE INDEX IF NOT EXISTS idx_direct_messages_global 
ON public.direct_messages(sender_id, receiver_id, created_at) 
WHERE community_id IS NULL;

-- Atualizar política de INSERT para permitir mensagens globais
DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;

CREATE POLICY "Users can send direct messages"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = sender_id) AND
  (
    (community_id IS NULL) OR 
    (is_community_member(auth.uid(), community_id) AND is_community_member(receiver_id, community_id))
  )
);

-- Atualizar política de SELECT para permitir visualizar mensagens globais
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.direct_messages;

CREATE POLICY "Users can view their direct messages"
ON public.direct_messages
FOR SELECT
TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));