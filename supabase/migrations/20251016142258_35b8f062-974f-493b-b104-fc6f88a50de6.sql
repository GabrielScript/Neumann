-- Atualizar itens do template '75 Hard - Versão Challenger Life'
UPDATE public.challenge_items 
SET 
  description = CASE position
    WHEN 1 THEN 'Escolha uma dieta saudável e siga sem exceções. Planeje suas refeições com antecedência.'
    WHEN 2 THEN 'Um treino deve ser ao ar livre. Pode ser caminhada, corrida, ciclismo, etc.'
    WHEN 3 THEN 'Cerca de 3.8 litros. Ajuda na hidratação e recuperação muscular.'
    WHEN 4 THEN 'Leitura de desenvolvimento pessoal, negócios ou autobiografias inspiradoras.'
  END,
  facilitators = CASE position
    WHEN 1 THEN 'Prepare marmitas no domingo, use apps de rastreamento de macros, tenha snacks saudáveis sempre à mão'
    WHEN 2 THEN 'Acorde mais cedo, separe roupa de treino na noite anterior, encontre parceiro de treino'
    WHEN 3 THEN 'Tenha garrafa grande sempre com você, coloque lembretes no celular, adicione limão para variar'
    WHEN 4 THEN 'Leia antes de dormir, audiobooks durante deslocamentos, tenha sempre livro na bolsa'
  END,
  difficulty = CASE position
    WHEN 1 THEN 4
    WHEN 2 THEN 5
    WHEN 3 THEN 3
    WHEN 4 THEN 2
  END,
  alignment_score = CASE position
    WHEN 1 THEN 9
    WHEN 2 THEN 10
    WHEN 3 THEN 8
    WHEN 4 THEN 7
  END
WHERE template_id = (SELECT id FROM public.challenge_templates WHERE name = '75 Hard - Versão Challenger Life');

-- Atualizar itens do template 'Monk Mode'
UPDATE public.challenge_items 
SET 
  description = CASE position
    WHEN 1 THEN 'Remova redes sociais, limite notificações, desligue TV. Foque no essencial.'
    WHEN 2 THEN 'Blocos de 90-120min de trabalho profundo sem interrupções.'
    WHEN 3 THEN 'Treino de força ou cardio, 30-60min diários.'
    WHEN 4 THEN '10-20min de meditação mindfulness pela manhã.'
  END,
  facilitators = CASE position
    WHEN 1 THEN 'Use bloqueadores de apps, modo avião durante trabalho, comunique limites a amigos/família'
    WHEN 2 THEN 'Técnica Pomodoro, ambiente silencioso, fones noise-cancelling, liste tarefas prioritárias'
    WHEN 3 THEN 'Treino em casa com bodyweight, parceiro de accountability, música motivacional'
    WHEN 4 THEN 'App Headspace/Calm, almofada confortável, horário fixo, comece com 5min e aumente'
  END,
  difficulty = CASE position
    WHEN 1 THEN 5
    WHEN 2 THEN 4
    WHEN 3 THEN 3
    WHEN 4 THEN 3
  END,
  alignment_score = CASE position
    WHEN 1 THEN 10
    WHEN 2 THEN 9
    WHEN 3 THEN 8
    WHEN 4 THEN 8
  END
WHERE template_id = (SELECT id FROM public.challenge_templates WHERE name = 'Monk Mode');

-- Atualizar itens do template 'Dopamine Detox'
UPDATE public.challenge_items 
SET 
  description = CASE position
    WHEN 1 THEN 'Zero redes sociais, streaming, jogos, pornografia por 21 dias.'
    WHEN 2 THEN 'Caminhada na natureza, leitura física, conversa presencial, arte.'
    WHEN 3 THEN 'Diário reflexivo sobre gatilhos, sentimentos e padrões de comportamento.'
    WHEN 4 THEN 'Durma 7-9h, acorde sem alarme se possível, sem telas 1h antes de dormir.'
  END,
  facilitators = CASE position
    WHEN 1 THEN 'Desinstale apps, bloqueie sites, comunique decisão a amigos, tenha plano B para tédio'
    WHEN 2 THEN 'Liste 10 atividades alternativas, tenha livros físicos, visite parques, ligue para amigos'
    WHEN 3 THEN 'Caderno dedicado, prompts de reflexão, escreva 5min toda noite, seja honesto consigo'
    WHEN 4 THEN 'Rotina noturna relaxante, quarto escuro e fresco, chá calmante, leitura leve antes dormir'
  END,
  difficulty = CASE position
    WHEN 1 THEN 5
    WHEN 2 THEN 3
    WHEN 3 THEN 2
    WHEN 4 THEN 3
  END,
  alignment_score = CASE position
    WHEN 1 THEN 10
    WHEN 2 THEN 9
    WHEN 3 THEN 7
    WHEN 4 THEN 8
  END
WHERE template_id = (SELECT id FROM public.challenge_templates WHERE name = 'Dopamine Detox');

-- Atualizar itens do template 'Biohacking Iniciante'
UPDATE public.challenge_items 
SET 
  description = CASE position
    WHEN 1 THEN 'Janela alimentar de 8h (ex: 12h-20h). Comece com 12h de jejum e aumente gradualmente.'
    WHEN 2 THEN 'Durma 7-9h, mesmos horários, quarto escuro/frio, sem cafeína após 14h.'
    WHEN 3 THEN 'Vitamina D, Ômega-3, Magnésio. Sempre com acompanhamento médico.'
    WHEN 4 THEN 'Rastreie sono (Oura/Whoop), HRV, glicose, peso, humor, energia.'
  END,
  facilitators = CASE position
    WHEN 1 THEN 'App Zero para tracking, café/chá sem açúcar durante jejum, electrólitos, refeições balanceadas'
    WHEN 2 THEN 'Blackout curtains, temperatura 18-20°C, suplemento de magnésio, rotina relaxante'
    WHEN 3 THEN 'Exames de sangue antes, compre marcas confiáveis, tome com gordura (Vit D), anote efeitos'
    WHEN 4 THEN 'Planilha ou app tracking, medição diária mesma hora, anote padrões, ajuste baseado em dados'
  END,
  difficulty = CASE position
    WHEN 1 THEN 4
    WHEN 2 THEN 3
    WHEN 3 THEN 2
    WHEN 4 THEN 3
  END,
  alignment_score = CASE position
    WHEN 1 THEN 8
    WHEN 2 THEN 9
    WHEN 3 THEN 7
    WHEN 4 THEN 8
  END
WHERE template_id = (SELECT id FROM public.challenge_templates WHERE name = 'Biohacking Iniciante');