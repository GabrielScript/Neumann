-- Adicionar coluna para nome na meditação de perdão
ALTER TABLE public.challenge_diary_entries
ADD COLUMN IF NOT EXISTS forgiveness_name text;