-- Criar tabela de frases diárias
CREATE TABLE IF NOT EXISTS public.daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de controle de frases vistas por usuário
CREATE TABLE IF NOT EXISTS public.user_daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.daily_quotes(id) ON DELETE CASCADE,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quote_id)
);

-- Habilitar RLS
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quotes ENABLE ROW LEVEL SECURITY;

-- Políticas para daily_quotes (todos podem ler)
CREATE POLICY "Anyone can view quotes"
  ON public.daily_quotes
  FOR SELECT
  USING (true);

-- Políticas para user_daily_quotes (usuários só veem seus próprios registros)
CREATE POLICY "Users can view own quote history"
  ON public.user_daily_quotes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quote history"
  ON public.user_daily_quotes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_user_daily_quotes_user_id ON public.user_daily_quotes(user_id);
CREATE INDEX idx_user_daily_quotes_shown_at ON public.user_daily_quotes(shown_at);

-- Inserir frases (categoria interna, não será mostrada ao usuário)
INSERT INTO public.daily_quotes (quote, category) VALUES
-- Sonhos e Lenda Pessoal
('Quando você deseja algo, todo o universo conspira para que realize o seu desejo.', 'sonhos'),
('As tarefas cotidianas jamais impediram alguém de seguir seus sonhos.', 'sonhos'),
('Ninguém está a salvo das derrotas. Mas é melhor perder alguns combates na luta pelos nossos sonhos do que ser derrotado sem saber sequer por que se está lutando.', 'sonhos'),
('O bom combate é aquele que travamos em nome de nossos sonhos; ele foi transportado dos campos de batalha para o interior de nós mesmos.', 'sonhos'),
('Quanto mais alguém se aproxima do sonho, mais a Lenda Pessoal se torna a verdadeira razão de viver.', 'sonhos'),
('Um profeta é alguém que continua ouvindo as mesmas vozes que ouvia na infância. E acredita nelas.', 'sonhos'),
('Só uma coisa torna um sonho impossível: o medo de fracassar.', 'sonhos'),
('A única maneira de seguir nossos sonhos é sermos generosos conosco mesmos.', 'sonhos'),
('Na fé, pode-se perder um jogo quando já está quase ganho.', 'sonhos'),
('O mundo está nas mãos daqueles que têm a coragem de sonhar e de correr o risco de viver seus sonhos.', 'sonhos'),
('O medo de sofrer é pior do que o próprio sofrimento. E nenhum coração jamais sofreu quando foi em busca de seus sonhos.', 'sonhos'),
('O homem não pode parar de sonhar. O sonho é o alimento da alma, assim como a comida é o alimento do corpo.', 'sonhos'),
('Quando renunciamos aos nossos sonhos, encontramos a paz e temos um breve período de tranquilidade. Mas os sonhos mortos começam a apodrecer dentro de nós e a infectar todo o ambiente em que vivemos. O que queríamos evitar na luta - a decepção e a derrota - torna-se o único legado de nossa covardia.', 'sonhos'),
('Os sonhos têm um preço. Existem sonhos caros e baratos, mas todos têm um preço.', 'sonhos'),
('A possibilidade de realizar um sonho é o que torna a vida interessante.', 'sonhos'),
('O primeiro sintoma de que estamos matando nossos sonhos é a falta de tempo. As pessoas mais ocupadas conseguem tempo para tudo. As que nada fazem estão sempre cansadas, não dão conta do pouco trabalho que têm e reclamam que o dia é muito curto.', 'sonhos'),
('Poucos aceitam o peso da própria vitória; a maioria desiste dos sonhos quando estes se tornam possíveis.', 'sonhos'),
('Seja quem você for ou o que você faça, se você deseja algo com firmeza, é porque esse desejo nasceu antes na alma do universo. É a sua missão na Terra.', 'sonhos'),

-- Amor
('Quando se ama, não é necessário entender tudo o que acontece externamente, porque tudo acontece dentro de nós.', 'amor'),
('Isto é a liberdade: sentir o que o coração deseja, independentemente da opinião dos outros. O amor liberta.', 'amor'),
('O amor é descoberto através da prática de amar, e não das palavras.', 'amor'),
('O verdadeiro amor não consiste em tentar corrigir os outros, mas em se alegrar ao ver que as coisas são melhores do que esperávamos.', 'amor'),
('Toda a vida do homem sobre a face da terra se resume na busca do amor. Não importa se ele finge correr atrás da sabedoria, do dinheiro ou do poder.', 'amor'),
('O amor só descansa quando morre. Um amor vivo é um amor em conflito.', 'amor'),
('O amor é um risco, mas sempre foi assim. Há milhares de anos as pessoas se buscam e se encontram.', 'amor'),
('Amar é observar as mesmas montanhas de ângulos diferentes.', 'amor'),
('O amor jamais separará um homem de sua Lenda Pessoal.', 'amor'),
('Pelo brilho nos olhos, desde o início dos tempos, as pessoas reconhecem seu verdadeiro amor.', 'amor'),
('O amor é como uma represa; se houver uma brecha por onde possa infiltrar-se um fio de água, logo ele começa a destruir as paredes. Chega um momento em que ninguém pode controlar a força da corrente.', 'amor'),
('Sempre existe no mundo uma pessoa que espera a outra, seja no meio do deserto ou no meio de uma grande cidade. E quando essas pessoas se cruzam e seus olhos se encontram, todo o passado e todo o futuro perdem completamente a importância e só existe aquele momento.', 'amor'),

-- Sabedoria e Transformação
('Quando alguém evolui, tudo ao seu redor também evolui. Quando nos esforçamos para ser melhores do que somos, tudo ao nosso redor também se torna melhor.', 'sabedoria'),
('Certas coisas são tão importantes que precisam ser descobertas sozinhas.', 'sabedoria'),
('O mundo se transforma e nós somos parte dessa transformação. Os anjos nos guiam e nos protegem.', 'sabedoria'),
('O verdadeiro caminho da sabedoria se identifica por apenas três coisas: deve ter amor, ser prático e poder ser percorrido por qualquer um.', 'sabedoria'),
('Conhecimento sem transformação não é sabedoria.', 'sabedoria'),
('Escute seu coração. Ele conhece todas as coisas, porque vem da Alma do Mundo e um dia retornará a ela.', 'sabedoria'),
('As coisas simples são as mais extraordinárias e somente os sábios conseguem vê-las.', 'sabedoria'),
('Aquele que não duvida de si mesmo é indigno, pois confia cegamente em sua capacidade e peca por orgulho. Bendito aquele que passa por momentos de indecisão.', 'sabedoria'),
('As flores refletem bem a Verdade. Quem tentar possuir uma flor verá sua beleza murchar. Mas quem apenas olha uma flor no campo a possuirá para sempre.', 'sabedoria'),
('Os homens que se julgam sábios são indecisos na hora de comandar e rebeldes na hora de servir.', 'sabedoria'),
('Quanto mais você se compreende, mais compreenderá o mundo.', 'sabedoria'),
('O segredo da sabedoria é não ter medo de errar.', 'sabedoria'),
('O maior de todos os pecados: o arrependimento.', 'sabedoria'),
('Julgar-se pior que os outros é um dos atos de orgulho mais violentos, porque é usar a maneira mais destrutiva possível de ser diferente.', 'sabedoria'),
('Sempre tendemos a ver coisas que não existem e permanecemos cegos diante das grandes lições que se encontram diante de nossos olhos.', 'sabedoria'),
('As portas do Paraíso foram abertas novamente. Por algum tempo – ninguém sabe exatamente quanto – poderão entrar todos os que perceberem que essas portas estão abertas.', 'sabedoria'),
('Quem se julga cheio de virtudes se paralisa. Mas quem se julga cheio de culpas também se paralisa.', 'sabedoria'),
('A maior grandeza que um ser humano pode experimentar é a aceitação do mistério.', 'sabedoria'),
('Aprender algo significa entrar em contato com um mundo desconhecido. É preciso ser humilde para aprender.', 'sabedoria'),
('Nós só aceitamos uma verdade quando a negamos, primeiramente, do fundo da alma.', 'sabedoria'),
('Um homem que preserva seus amigos jamais é dominado pelas tempestades da existência; tem forças para suportar as dificuldades e para seguir em frente.', 'sabedoria'),
('A vaidade pode ser um bom estímulo. O dinheiro também. Mas nunca podemos confundi-los com objetivos.', 'sabedoria'),
('Do alto de uma montanha, somos capazes de ver tudo pequeno. Nossas glórias e nossas tristezas deixam de ser importantes. Aquilo que conquistamos ou perdemos fica abaixo. Do alto da montanha, vemos que o mundo é grande e os horizontes, largos.', 'sabedoria'),

-- Felicidade e Vida
('Se ouve o seu coração, uma pessoa se deslumbra diante do mistério da vida, está aberta aos milagres e sente alegria e entusiasmo pelo que faz.', 'felicidade'),
('Cada homem tem um tesouro que o está esperando.', 'felicidade'),
('A busca da felicidade é pessoal, e não um modelo que podemos repassar aos demais.', 'felicidade'),
('A felicidade às vezes é uma bênção, mas geralmente é uma conquista.', 'felicidade'),
('O fato de você encontrar algo muito importante em sua vida não quer dizer que deva renunciar a todo o resto.', 'felicidade'),
('A forma de corrigir o pecado é andar sempre para a frente, adaptando-nos a novas situações e recebendo, em troca, as bênçãos que a vida dá com tanta generosidade àqueles que as pedem.', 'felicidade'),
('Em nossas orações, sempre falamos de nossos erros e do que gostaríamos que nos acontecesse. Mas o Senhor já sabe tudo isso e, às vezes, só nos pede que escutemos o que o universo nos diz. E que tenhamos paciência.', 'felicidade'),
('Seu coração está onde está seu tesouro. E é necessário que você encontre seu tesouro para que tudo possa fazer sentido.', 'felicidade'),
('A melhor maneira de servir a Deus é ir ao encontro dos próprios sonhos. Só quem é feliz pode espalhar felicidade.', 'felicidade'),
('Uma criança sempre pode ensinar três coisas a um adulto: a alegrar-se sem motivo, a estar sempre ocupado com algo e a saber exigir com todas as suas forças aquilo que deseja.', 'felicidade'),
('Os sentimentos devem ser livres. Não se deve julgar o amor futuro pelo sofrimento do passado.', 'felicidade'),
('Quem conhece a felicidade nunca mais aceitará humildemente a tristeza.', 'felicidade'),
('Se ouvirmos a criança que temos na alma, nossos olhos voltarão a brilhar. Se não perdermos contato com essa criança, não perderemos o contato com a vida.', 'felicidade'),

-- Destino e Vida
('Todos os dias Deus nos dá um momento em que é possível mudar tudo o que nos faz infelizes. O instante mágico é o momento em que um sim ou um não podem mudar toda a nossa existência.', 'destino'),
('Devemos aproveitar quando a sorte está do nosso lado e fazer tudo para ajudá-la, da mesma maneira que ela está nos ajudando.', 'destino'),
('A maior mentira do mundo é que, em determinado momento de nossa existência, perdemos o controle de nossas vidas e elas passam a ser governadas pelo destino.', 'destino'),
('Tudo que está sobre a face da Terra se transforma sempre, porque a Terra está viva e tem uma alma. Somos parte desta Alma e poucas vezes sabemos que ela sempre trabalha a nosso favor.', 'destino'),
('Nós só entendemos a vida e o Universo quando não buscamos explicações. Então tudo fica claro.', 'destino'),
('Quando todos os dias parecem iguais, é porque deixamos de perceber as coisas boas que aparecem em nossas vidas.', 'destino'),
('Às vezes, um acontecimento sem importância é capaz de transformar toda a beleza em um momento de angústia. Insistimos em ver uma pequena mancha à frente de nossos olhos e esquecemos as montanhas, os campos e as oliveiras.', 'destino'),
('A única oportunidade que uma tragédia nos oferece é a de reconstruir nossa vida.', 'destino'),
('Há momentos em que as tribulações se apresentam e não podemos evitá-las. Elas estão lá por algum motivo, mas só compreendemos quando as superamos.', 'destino'),
('Cada pessoa pode ter duas atitudes em sua existência: Construir ou Plantar. Os construtores podem demorar anos, mas um dia terminam aquilo que estavam fazendo. Então, eles param e ficam limitados por suas próprias paredes. A vida perde o sentido quando a construção acaba. Os que plantam sofrem com as tempestades, as estações e raramente descansam. Mas, ao contrário de um edifício, o jardim jamais deixa de crescer. E, ao mesmo tempo que exige a atenção do jardineiro, também permite que, para ele, a vida seja uma grande aventura.', 'destino'),
('O homem é o único ser da Natureza que tem consciência de que vai morrer. Mesmo sabendo que tudo terminará, façamos da vida uma luta digna de um ser eterno.', 'destino'),
('É necessário nunca relaxar, mesmo que tenhamos chegado muito longe.', 'destino'),
('Na vida, tudo pode mudar no espaço de um simples grito, antes que as pessoas possam se acostumar com as mudanças.', 'destino'),
('Um sintoma da morte de nossos sonhos são nossas certezas. Como não queremos ver a vida como uma grande aventura a ser vivida, nos julgamos sábios no pouco que pedimos da existência. E não percebemos a imensa Alegria que se encontra no coração de quem luta.', 'destino'),
('Outro sintoma da morte dos nossos sonhos é a paz. A vida se torna uma tarde de domingo, sem nos pedir grandes coisas e sem exigir mais do que queremos dar.', 'destino'),
('Tudo o que é novo desconcerta. A vida nos encontra desprevenidos e nos obriga a caminhar em direção ao desconhecido, mesmo que não queiramos, mesmo que não precisemos.', 'destino'),
('As decisões são apenas o começo de algo. Quando alguém toma uma decisão, mergulha em uma poderosa corrente que leva a pessoa até um lugar que jamais teria sonhado no momento de decidir.', 'destino'),
('O esforço é saudável e indispensável. Mas, sem resultado, não significa nada.', 'destino'),
('Na verdade, todo problema, após resolvido, parece muito simples. A grande vitória - que hoje parece fácil - foi o resultado de uma série de pequenas vitórias que passaram despercebidas.', 'destino'),
('Quantas coisas perdemos por medo de perder...', 'destino'),
('Não deixe que as dúvidas paralisem suas ações. Tome sempre todas as decisões que você precisa tomar, mesmo sem ter a certeza de que está decidindo corretamente.', 'destino'),
('É necessário saber distinguir o passageiro do definitivo. O passageiro é o inevitável, e o definitivo, as lições do inevitável.', 'destino'),
('Existem momentos na vida em que a única alternativa possível é perder o controle.', 'destino'),
('Quando alguém deseja algo, deve saber que corre riscos. E é por isso que a vida vale a pena.', 'destino'),
('É no presente que está o segredo; se você prestar atenção ao presente, poderá melhorá-lo. E se você melhorar o presente, o que acontecerá depois também será melhor. Cada dia traz em si a Eternidade.', 'destino'),

-- Escolha e Caminho
('Deus deu a seus filhos o maior dos dons: a capacidade de decidir seus atos.', 'escolha'),
('Não precisamos saber nem como nem onde; mas há uma pergunta que todos devemos nos fazer sempre que começamos algo: Para que faço isto?', 'escolha'),
('O homem deve escolher; não aceitar seu destino.', 'escolha'),
('Os homens são donos do seu próprio destino. Podem cometer os mesmos erros, ou podem fugir de tudo o que desejam e do que a vida, generosamente, coloca diante deles.', 'escolha'),
('Muitas pessoas ficam fascinadas pelos detalhes e esquecem o que procuram.', 'escolha'),
('É preciso correr riscos, seguir certos caminhos e abandonar outros. Nenhuma pessoa escolhe sem medo.', 'escolha'),
('Quem interfere no destino dos outros nunca encontrará o seu.', 'escolha'),
('Realize sua missão e não se preocupe com a dos outros. Tenha a certeza de que Deus também fala com eles e que estão tão empenhados quanto você em descobrir o sentido desta vida.', 'escolha'),
('Um homem deve passar por diversas etapas antes de poder cumprir seu destino.', 'escolha'),
('Quando se viaja em busca de um objetivo, é muito importante prestar atenção ao Caminho.', 'escolha'),
('O Caminho é o que nos ensina a melhor maneira de chegar e nos enriquece enquanto o estamos percorrendo.', 'escolha'),
('Deus pergunta ao homem em certos momentos: Qual é o sentido desta existência cheia de sofrimento? O homem que não sabe responder a essa pergunta se conforma. Enquanto o outro, aquele que busca um sentido para sua vida, considera que Deus tem sido injusto e decide desafiar seu próprio destino.', 'escolha'),
('Deus sorri, porque é isso que Ele quer: que cada um tenha em suas mãos a responsabilidade de sua própria vida.', 'escolha'),
('Uma coisa é acreditar que você está no caminho certo; outra é acreditar que ele é o único. Jamais podemos julgar a vida dos outros, porque cada um conhece a sua própria dor e suas renúncias.', 'escolha'),
('Quando um homem busca seu destino, muitas vezes se vê forçado a mudar de rumo. Outras vezes, as circunstâncias externas são mais fortes e ele é obrigado a se acovardar e ceder. Tudo isso faz parte do aprendizado.', 'escolha'),
('Todas as pessoas, no início de sua juventude, sabem qual é a sua Lenda Pessoal. Nesse momento da vida, tudo é claro, tudo é possível, e elas não têm medo de sonhar. No entanto, à medida que o tempo vai passando, uma força misteriosa tenta convencê-las de que é impossível realizar essa Lenda Pessoal.', 'escolha'),
('Todo homem tem o direito de duvidar de sua tarefa e de abandoná-la de vez em quando; a única coisa que não pode fazer é esquecê-la.', 'escolha'),
('Não são as explicações que nos fazem avançar; é nossa vontade de seguir em frente.', 'escolha'),
('Deus escreveu no mundo o caminho que cada homem deve seguir.', 'escolha'),
('O dom é de quem queira aceitá-lo. Basta crer, aceitar e não ter medo de cometer alguns erros.', 'escolha'),
('Em algumas pessoas esse dom se manifesta espontaneamente. Outras precisam trabalhar para encontrá-lo.', 'escolha'),
('A cada momento de nossa existência, temos que escolher entre uma alternativa e outra. Uma simples decisão pode afetar uma pessoa pelo resto de sua vida.', 'escolha'),

-- Fé e Espiritualidade
('Deus é o mesmo, embora tenha mil nomes; mas você tem que escolher um nome para chamá-lo.', 'fe'),
('O homem que não se envergonha de si mesmo é capaz de manifestar a glória de Deus.', 'fe'),
('O Senhor escuta as orações dos que pedem para esquecer o ódio. Mas está surdo para os que querem fugir do amor.', 'fe'),
('Não ofereça a Deus somente a dor de suas penitências. Ofereça-lhe também suas alegrias.', 'fe'),
('Deus é a palavra. Tenha cuidado com o que diz em qualquer instante da sua vida.', 'fe'),
('A fé é uma conquista difícil, que exige combates diários para ser mantida.', 'fe'),
('Somente nos leva a Deus aquele caminho que qualquer pessoa pode percorrer.', 'fe'),
('Chegamos exatamente onde devemos chegar, porque a mão de Deus sempre guia aquele que marcha com fé.', 'fe'),
('A melhor maneira de mergulhar em Deus é através do amor.', 'fe'),
('Os sábios entenderam que este mundo natural é apenas uma imagem e uma cópia do paraíso. A simples existência deste mundo é a garantia de que existe outro mais perfeito que este.', 'fe'),
('Os anjos – embora estejam sempre presentes – fazem-se notar apenas para aqueles que creem em sua existência.', 'fe'),
('Onde você desejar ver o rosto de Deus, você o verá. E se não quiser vê-lo, não faz a menor diferença, contanto que a sua obra seja boa.', 'fe'),
('Deus, com sua infinita sabedoria, escondeu o inferno no meio do paraíso, para que sempre estivéssemos atentos.', 'fe'),
('A verdade sempre está onde existe a fé. Os budistas, os hindus, os indígenas, os muçulmanos, os judeus, todos têm razão: sempre que o homem seguir com sinceridade o caminho da fé, será capaz de aproximar-se de Deus e de realizar milagres.', 'fe'),
('Somente os homens e mulheres com a sagrada chama no coração possuem a coragem de enfrentar a Deus. E somente estes conhecem o caminho de volta até Seu amor, porque entendem, finalmente, que a tragédia não é uma punição, mas um desafio.', 'fe'),
('Deus está onde o deixam entrar.', 'fe'),
('Existem muitas maneiras de cometer suicídio. Aqueles que tentam matar o corpo ofendem a lei de Deus. Aqueles que tentam matar a alma também ofendem essa lei, embora essa falta seja menos visível aos olhos do homem.', 'fe'),
('Nada é uma oportunidade única. O Senhor concede aos homens muitas oportunidades.', 'fe'),
('Lembre-se que o primeiro caminho direto para Deus é a oração. E o segundo caminho direto é a alegria.', 'fe'),
('As palavras de Deus estão escritas no mundo que nos rodeia. Basta prestar atenção ao que acontece em nossa vida para descobrir, a qualquer momento do dia, onde Ele esconde suas palavras e sua vontade.', 'fe'),
('Às vezes, certas bênçãos de Deus entram estilhaçando todos os vitrais.', 'fe'),
('Quando a oração é feita com as palavras da alma, ela é muito mais poderosa.', 'fe'),
('Nós só sentimos medo de perder aquilo que temos, sejam nossas vidas ou nossas posses.', 'fe'),
('Mas esse medo passa quando entendemos que nossa história e a história do mundo foram escritas pela mesma Mão.', 'fe');