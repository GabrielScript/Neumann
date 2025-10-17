-- Criar tabela para entradas do diário de bordo
CREATE TABLE challenge_diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_number INTEGER NOT NULL,
  
  -- Respostas do diário
  reason_to_live TEXT,
  world_contribution TEXT,
  change_past TEXT,
  
  -- 6 ações para amanhã
  action_1 TEXT,
  action_2 TEXT,
  action_3 TEXT,
  action_4 TEXT,
  action_5 TEXT,
  action_6 TEXT,
  actions_belief_score INTEGER,
  actions_belief_arguments TEXT,
  
  -- 3 gratidões
  gratitude_1 TEXT,
  gratitude_2 TEXT,
  gratitude_3 TEXT,
  
  -- Meditação do perdão
  forgiveness_completed BOOLEAN DEFAULT FALSE,
  
  -- Conclusão
  learnings TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(challenge_id, date)
);

-- RLS Policies
ALTER TABLE challenge_diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diary entries"
  ON challenge_diary_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own diary entries"
  ON challenge_diary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diary entries"
  ON challenge_diary_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diary entries"
  ON challenge_diary_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_challenge_diary_entries_updated_at
  BEFORE UPDATE ON challenge_diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir template do Desafio do Diário de Bordo
INSERT INTO challenge_templates (
  name,
  description,
  duration_days,
  is_default,
  is_public
) VALUES (
  'Desafio do Diário de Bordo',
  'O diário de bordo é um instrumento de registro pessoal e reflexivo usado para documentar experiências, pensamentos, aprendizados e sentimentos ao longo de uma jornada — seja ela uma viagem, um projeto pessoal ou um processo de autoconhecimento.',
  40,
  true,
  true
);

-- Inserir item único do desafio
INSERT INTO challenge_items (
  template_id,
  title,
  description,
  priority,
  position
) VALUES (
  (SELECT id FROM challenge_templates WHERE name = 'Desafio do Diário de Bordo' LIMIT 1),
  'Preencher o Diário de Bordo',
  'Preencha o documento completo do diário de bordo com reflexões sobre o seu dia, ações para amanhã, gratidões, meditação do perdão e aprendizados.',
  'importante',
  0
);