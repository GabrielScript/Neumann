-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User stats for gamification
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  tree_stage TEXT NOT NULL DEFAULT 'seed',
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Challenge templates (library)
CREATE TABLE public.challenge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.challenge_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view public templates"
  ON public.challenge_templates FOR SELECT
  USING (is_public = TRUE OR is_default = TRUE);

CREATE POLICY "Users can view own templates"
  ON public.challenge_templates FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create templates"
  ON public.challenge_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Active challenges (user's current challenge)
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.challenge_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON public.challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own challenges"
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON public.challenges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenges"
  ON public.challenges FOR DELETE
  USING (auth.uid() = user_id);

-- Challenge items (checklist items)
CREATE TYPE priority_level AS ENUM ('imprescindivel', 'importante', 'acessorio');

CREATE TABLE public.challenge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.challenge_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  facilitators TEXT,
  alignment_score INTEGER CHECK (alignment_score >= 1 AND alignment_score <= 10),
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  priority priority_level NOT NULL DEFAULT 'importante',
  reminder_time TIME,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT challenge_or_template CHECK (
    (challenge_id IS NOT NULL AND template_id IS NULL) OR
    (challenge_id IS NULL AND template_id IS NOT NULL)
  )
);

ALTER TABLE public.challenge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge items"
  ON public.challenge_items FOR SELECT
  USING (
    challenge_id IN (SELECT id FROM public.challenges WHERE user_id = auth.uid()) OR
    template_id IN (SELECT id FROM public.challenge_templates WHERE is_public = TRUE OR is_default = TRUE OR created_by = auth.uid())
  );

CREATE POLICY "Users can create challenge items"
  ON public.challenge_items FOR INSERT
  WITH CHECK (
    challenge_id IN (SELECT id FROM public.challenges WHERE user_id = auth.uid()) OR
    template_id IN (SELECT id FROM public.challenge_templates WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can update own challenge items"
  ON public.challenge_items FOR UPDATE
  USING (
    challenge_id IN (SELECT id FROM public.challenges WHERE user_id = auth.uid()) OR
    template_id IN (SELECT id FROM public.challenge_templates WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can delete own challenge items"
  ON public.challenge_items FOR DELETE
  USING (
    challenge_id IN (SELECT id FROM public.challenges WHERE user_id = auth.uid()) OR
    template_id IN (SELECT id FROM public.challenge_templates WHERE created_by = auth.uid())
  );

-- Daily progress tracking
CREATE TABLE public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.challenge_items(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, item_id, date)
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.challenge_progress FOR SELECT
  USING (challenge_id IN (SELECT id FROM public.challenges WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own progress"
  ON public.challenge_progress FOR INSERT
  WITH CHECK (challenge_id IN (SELECT id FROM public.challenges WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own progress"
  ON public.challenge_progress FOR UPDATE
  USING (challenge_id IN (SELECT id FROM public.challenges WHERE user_id = auth.uid()));

-- Life goals
CREATE TABLE public.life_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deadline DATE,
  happiness_level INTEGER CHECK (happiness_level >= 1 AND happiness_level <= 10),
  motivation TEXT,
  action_plan TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.life_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON public.life_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON public.life_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.life_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.life_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default challenge templates
INSERT INTO public.challenge_templates (name, description, duration_days, is_default, is_public) VALUES
('75 Hard - Versão Challenger Life', 'Desafio de transformação completa: dieta rigorosa, 2 treinos diários, 1 galão de água, 10 páginas de leitura e foto de progresso.', 75, TRUE, TRUE),
('Monk Mode', 'Período de foco intenso: elimine distrações, deep work, exercício diário, meditação e alimentação consciente.', 14, TRUE, TRUE),
('Dopamine Detox', 'Reajuste seu sistema de recompensa: substitua atividades de alta estimulação por hábitos de baixa estimulação.', 21, TRUE, TRUE),
('Biohacking Iniciante', 'Experimentos de auto-otimização: jejum intermitente, otimização de sono, suplementação consciente e tracking.', 30, TRUE, TRUE);

-- Insert items for 75 Hard template
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Seguir dieta rigorosa (sem álcool/comida não planejada)', 'imprescindivel', 1, 'Escolha uma dieta saudável e siga sem exceções'
FROM public.challenge_templates WHERE name = '75 Hard - Versão Challenger Life';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Treino 1: 45 minutos (1 ao ar livre)', 'imprescindivel', 2, 'Pelo menos um dos treinos deve ser ao ar livre'
FROM public.challenge_templates WHERE name = '75 Hard - Versão Challenger Life';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Treino 2: 45 minutos', 'imprescindivel', 3, 'Segundo treino do dia, pode ser indoor'
FROM public.challenge_templates WHERE name = '75 Hard - Versão Challenger Life';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Beber 1 galão (3.8L) de água', 'imprescindivel', 4, 'Mantenha-se hidratado durante todo o dia'
FROM public.challenge_templates WHERE name = '75 Hard - Versão Challenger Life';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Ler 10 páginas de desenvolvimento pessoal', 'imprescindivel', 5, 'Sem audiobooks, leitura física ou digital'
FROM public.challenge_templates WHERE name = '75 Hard - Versão Challenger Life';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Foto de progresso', 'importante', 6, 'Registre sua evolução física'
FROM public.challenge_templates WHERE name = '75 Hard - Versão Challenger Life';

-- Insert items for Monk Mode
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Zero redes sociais recreativas', 'imprescindivel', 1, 'Use apenas para trabalho se necessário'
FROM public.challenge_templates WHERE name = 'Monk Mode';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, '4 horas de Deep Work', 'imprescindivel', 2, 'Trabalho focado sem distrações'
FROM public.challenge_templates WHERE name = 'Monk Mode';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Exercício físico (30+ min)', 'importante', 3, 'Qualquer atividade física'
FROM public.challenge_templates WHERE name = 'Monk Mode';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Meditação (20 min)', 'importante', 4, 'Cultive presença e foco'
FROM public.challenge_templates WHERE name = 'Monk Mode';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Zero álcool/substâncias', 'imprescindivel', 5, 'Mente e corpo limpos'
FROM public.challenge_templates WHERE name = 'Monk Mode';

-- Insert items for Dopamine Detox
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Evitar redes sociais/streaming', 'imprescindivel', 1, 'Substitua por leitura ou caminhada'
FROM public.challenge_templates WHERE name = 'Dopamine Detox';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Substituir videogame por hobby criativo', 'importante', 2, 'Desenho, música, escrita, jardinagem'
FROM public.challenge_templates WHERE name = 'Dopamine Detox';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Caminhada sem fones (30 min)', 'importante', 3, 'Observe o ambiente ao seu redor'
FROM public.challenge_templates WHERE name = 'Dopamine Detox';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Journaling sobre impulsos', 'acessorio', 4, 'Registre quando sentir vontade de estímulos altos'
FROM public.challenge_templates WHERE name = 'Dopamine Detox';

-- Insert items for Biohacking
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Jejum intermitente 16/8', 'importante', 1, 'Janela de alimentação de 8 horas'
FROM public.challenge_templates WHERE name = 'Biohacking Iniciante';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Tracking: Sono (HRV/qualidade)', 'imprescindivel', 2, 'Use app de monitoramento'
FROM public.challenge_templates WHERE name = 'Biohacking Iniciante';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Exposição solar matinal (15 min)', 'importante', 3, 'Regula ritmo circadiano'
FROM public.challenge_templates WHERE name = 'Biohacking Iniciante';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Cafeína estratégica (90-120min após acordar)', 'acessorio', 4, 'Otimiza energia e evita crash'
FROM public.challenge_templates WHERE name = 'Biohacking Iniciante';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_life_goals_updated_at
  BEFORE UPDATE ON public.life_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();