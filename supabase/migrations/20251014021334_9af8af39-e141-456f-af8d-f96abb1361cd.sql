-- Remover a constraint que limita a apenas 1 desafio ativo por usuário
-- Isso permitirá múltiplos desafios simultâneos baseado no plano de assinatura
DROP INDEX IF EXISTS public.challenges_user_id_active_key;