-- Adicionar coluna alignment_score na tabela challenges
ALTER TABLE challenges 
ADD COLUMN alignment_score INTEGER;

-- Adicionar constraint para validar valores entre 1 e 10
ALTER TABLE challenges
ADD CONSTRAINT alignment_score_range CHECK (alignment_score >= 1 AND alignment_score <= 10);

-- Comentário descritivo
COMMENT ON COLUMN challenges.alignment_score IS 'Pontuação de alinhamento do desafio com objetivos do usuário (1-10)';