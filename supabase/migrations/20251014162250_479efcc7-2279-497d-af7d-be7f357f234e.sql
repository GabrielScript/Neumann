-- Adicionar coluna para rastrear dias completados
ALTER TABLE challenges
ADD COLUMN completed_days integer NOT NULL DEFAULT 0;

-- Adicionar índice para melhor performance
CREATE INDEX idx_challenges_completed_days ON challenges(completed_days);

-- Adicionar comentário explicativo
COMMENT ON COLUMN challenges.completed_days IS 'Número de dias em que todos os itens foram completados (não precisa ser consecutivo)';