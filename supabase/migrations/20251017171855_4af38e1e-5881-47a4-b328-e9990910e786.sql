-- Criar tabela para entradas do diário da gratidão
CREATE TABLE IF NOT EXISTS public.gratitude_diary_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  day_number integer NOT NULL,
  gratitude_1 text,
  gratitude_2 text,
  gratitude_3 text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(challenge_id, date)
);

-- Habilitar RLS
ALTER TABLE public.gratitude_diary_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own gratitude entries"
  ON public.gratitude_diary_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own gratitude entries"
  ON public.gratitude_diary_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gratitude entries"
  ON public.gratitude_diary_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gratitude entries"
  ON public.gratitude_diary_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Inserir template do Desafio do Diário da Gratidão
INSERT INTO public.challenge_templates (name, description, duration_days, is_default, is_public)
VALUES (
  'Desafio do Diário da Gratidão',
  'O diário da gratidão é uma prática reflexiva que consiste em registrar, diariamente ou com frequência regular, as coisas pelas quais uma pessoa se sente grata. Essa ferramenta, simples e poderosa, está fundamentada na psicologia positiva e tem efeitos comprovados sobre o bem-estar emocional, mental e social.',
  50,
  true,
  true
);

-- Inserir item do desafio
INSERT INTO public.challenge_items (template_id, title, description, position, priority)
SELECT 
  id,
  'Escrever 3 gratidões',
  'Escreva 3 coisas pelas quais você é grato na sua vida',
  1,
  'importante'
FROM public.challenge_templates
WHERE name = 'Desafio do Diário da Gratidão';