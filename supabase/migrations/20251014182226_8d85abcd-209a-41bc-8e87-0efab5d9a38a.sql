-- Criar tabela para mensagens diretas entre membros
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  community_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false
);

-- Habilitar RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para mensagens diretas
-- Usuários podem ver mensagens enviadas ou recebidas por eles
CREATE POLICY "Users can view their direct messages"
ON public.direct_messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Usuários podem enviar mensagens
CREATE POLICY "Users can send direct messages"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  is_community_member(auth.uid(), community_id) AND
  is_community_member(receiver_id, community_id)
);

-- Usuários podem marcar suas mensagens recebidas como lidas
CREATE POLICY "Users can update their received messages"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Usuários podem deletar suas mensagens enviadas
CREATE POLICY "Users can delete their sent messages"
ON public.direct_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Índices para melhor performance
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_community ON public.direct_messages(community_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- Habilitar realtime para mensagens diretas
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;