-- Criar desafio "180 Dias - Protocolo da Arquitetura"
INSERT INTO public.challenge_templates (name, description, duration_days, is_default, is_public)
VALUES (
  '180 Dias - Protocolo da Arquitetura',
  'Sistema intensivo de reconstrução de vida baseado em 6 pilares: Redesenho de Identidade, Fortificação Psicológica, Transformação Física, Aceleração de Competências, Reengenharia Ambiental e Recalibração Social. Foca na mudança da identidade como pré-requisito para mudança de hábitos.',
  180,
  TRUE,
  TRUE
);

-- PILAR 1: REDESENHO DE IDENTIDADE (Posições 1-4)
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Agir como o "Arquétipo" definido', 'imprescindivel', 1, 'Comportar-se ativamente como a nova versão desde o início do dia (linguagem corporal, tom de voz, micro-escolhas)'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Documentar provas no diário', 'importante', 2, 'Registrar momentos em que você agiu como o Arquétipo e como as pessoas reagiram'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Evitar situações do "velho eu"', 'importante', 3, 'Proteger conscientemente o sinal evitando pessoas, lugares e situações que fazem reverter à identidade antiga'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Auditar contradições no ambiente', 'acessorio', 4, 'Identificar e eliminar objetos, hábitos ou rotinas que pertencem ao "velho eu"'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

-- PILAR 2: FORTIFICAÇÃO PSICOLÓGICA (Posições 5-9)
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Executar pontos inegociáveis', 'imprescindivel', 5, 'Realizar ações mínimas diárias independente do estado emocional ou circunstâncias'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Prática de quietude visual (10-20 min)', 'importante', 6, 'Ficar em silêncio absoluto, deitado, com venda nos olhos para recarregar circuitos de dopamina'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Endurecimento voluntário', 'importante', 7, 'Aplicar dificuldade voluntária: jejum 24h semanal, água gelada, treinos intensos ou respiração Wim Hof'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Limitar redes sociais a 30 min/dia', 'importante', 8, 'Reduzir drasticamente consumo de "porcaria mental" e entretenimento reativo'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Auditar gatilhos emocionais', 'acessorio', 9, 'Rastrear picos emocionais (raiva, ansiedade) e decidir antecipadamente a resposta do Arquétipo'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

-- PILAR 3: TRANSFORMAÇÃO FÍSICA (Posições 10-14)
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Movimento diário inegociável', 'imprescindivel', 10, 'Realizar algum movimento todos os dias: caminhada, cardio, musculação ou movimento intuitivo'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Zero álcool e nicotina', 'imprescindivel', 11, 'Eliminação completa de álcool e nicotina durante os 180 dias'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Consumo adequado de proteína', 'importante', 12, 'Garantir ingestão de 1.6g de proteína por kg de peso corporal para saciedade e construção muscular'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Dormir 7+ horas por noite', 'importante', 13, 'Otimizar sono: média de 7h, sem telas 1-2h antes, ambiente escuro e fresco'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Cortar cafeína após 14h', 'acessorio', 14, 'Eliminar cafeína após as 14h para otimizar qualidade do sono'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

-- PILAR 4: ACELERAÇÃO DE COMPETÊNCIAS (Posições 15-18)
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Trabalho focado na habilidade', 'importante', 15, 'Dedicar tempo diário à UMA habilidade rara e valiosa escolhida (foco singular)'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Documentar progresso da habilidade', 'importante', 16, 'Registrar diariamente evolução, aprendizados e iterações da habilidade'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Buscar feedback brutal semanal', 'importante', 17, 'Pedir ativamente feedback sincero de pessoas que estão à frente naquela habilidade'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Imersão de saturação', 'acessorio', 18, 'Dedicar períodos de imersão total na habilidade (assistir, ouvir, pensar sobre, visualizar)'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

-- PILAR 5: REENGENHARIA AMBIENTAL (Posições 19-21)
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Manter ambiente minimalista', 'importante', 19, 'Eliminar excesso físico (objetos), digital (apps) e social (contatos que drenam)'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Reduzir fricção para bons hábitos', 'importante', 20, 'Tornar hábitos positivos 10s mais fáceis e hábitos negativos mais difíceis (design de ambiente)'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Zero celular na zona de descanso', 'acessorio', 21, 'Não levar celular para cama ou zona de descanso (zonas sagradas distintas)'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

-- PILAR 6: RECALIBRAÇÃO SOCIAL (Posições 22-24)
INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Investir em conexões construtivas', 'importante', 22, 'Dedicar tempo e energia a pessoas alinhadas com o Arquétipo que desafiam seu potencial'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Reduzir contato com relações destrutivas', 'importante', 23, 'Cortar ou diminuir drasticamente contato com pessoas que validam mediocridade'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';

INSERT INTO public.challenge_items (template_id, title, priority, position, description)
SELECT id, 'Avaliar círculo social semanalmente', 'acessorio', 24, 'Mapear interações semanais e pontuar se são construtivas ou destrutivas'
FROM public.challenge_templates WHERE name = '180 Dias - Protocolo da Arquitetura';