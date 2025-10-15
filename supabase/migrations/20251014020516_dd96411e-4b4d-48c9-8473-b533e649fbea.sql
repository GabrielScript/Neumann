-- Remover "- Versão Challenger Life" dos nomes dos desafios
UPDATE challenge_templates
SET name = REPLACE(name, ' - Versão Challenger Life', '')
WHERE name LIKE '%Versão Challenger Life%';