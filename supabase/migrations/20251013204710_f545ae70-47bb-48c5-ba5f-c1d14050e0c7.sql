-- Adicionar colunas para medalhas diárias e troféu especial de vida
ALTER TABLE user_stats 
  ADD COLUMN IF NOT EXISTS daily_medals_gold INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_medals_silver INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_medals_bronze INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS life_goal_trophies INTEGER DEFAULT 0;

-- Criar tabela para rastrear medalhas diárias
CREATE TABLE IF NOT EXISTS daily_medals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  medal_type TEXT NOT NULL CHECK (medal_type IN ('gold', 'silver', 'bronze')),
  challenges_completed INTEGER NOT NULL DEFAULT 0,
  total_challenges INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Habilitar RLS na tabela de medalhas diárias
ALTER TABLE daily_medals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para daily_medals
CREATE POLICY "Users can view own daily medals"
  ON daily_medals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily medals"
  ON daily_medals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily medals"
  ON daily_medals FOR UPDATE
  USING (auth.uid() = user_id);