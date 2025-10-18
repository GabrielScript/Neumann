import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, TrendingUp, Flame, Sparkles, Zap, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useOnboarding } from '@/hooks/useOnboarding';

interface UserStats {
  xp: number;
  level: number;
  current_streak: number;
  best_streak: number;
  tree_stage: string;
  life_goal_trophies: number;
  challenges_completed: number;
}

interface Challenge {
  id: string;
  name: string;
  duration_days: number;
  start_date: string;
  end_date: string;
}

interface Goal {
  id: string;
  title: string;
  deadline: string | null;
}

interface Profile {
  full_name: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { onboardingStatus, isLoading: isLoadingOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('Champion');
  const [rankingPosition, setRankingPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    // Verificar se o onboarding foi completado
    if (user && !isLoadingOnboarding) {
      if (!onboardingStatus || !onboardingStatus.completed) {
        navigate('/onboarding');
        return;
      }
      loadDashboardData();
    }
  }, [user, authLoading, onboardingStatus, isLoadingOnboarding, navigate]);

  const loadDashboardData = async () => {
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (profileData?.full_name) {
        setUserName(profileData.full_name.split(' ')[0]);
      }

      // Load user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (statsError) throw statsError;
      setStats(statsData);

      // Calculate user ranking position based on level
      if (statsData?.level) {
        const { count, error: countError } = await supabase
          .from('user_stats')
          .select('*', { count: 'exact', head: true })
          .gt('level', statsData.level);

        if (!countError && count !== null) {
          setRankingPosition(count + 1);
        }
      }

      // Load active challenges (all of them, not just one)
      const { data: challengesData } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setActiveChallenges(challengesData || []);

      // Load goals
      const { data: goalsData } = await supabase
        .from('life_goals')
        .select('id, title, deadline')
        .eq('user_id', user?.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(3);

      setGoals(goalsData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoadingOnboarding) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-primary font-display text-xl">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus-ring"
      >
        Pular para conteúdo principal
      </a>
      
      <div 
        id="main-content"
        className="space-y-6 lg:space-y-8 max-w-7xl mx-auto"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Saudação Personalizada */}
        <header className="flex items-center gap-3 animate-slide-in-bottom">
          <span 
            className="text-4xl lg:text-5xl animate-wave" 
            role="img" 
            aria-label="Mão acenando"
          >
            👋
          </span>
          <div>
            <h1 className="text-responsive-2xl font-black text-primary font-display">
              Olá, {userName}!
            </h1>
            <p className="text-responsive-base text-foreground mt-1 font-body">
              Pronto para conquistar seus desafios hoje?
            </p>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {/* Card de Desafios Ativos */}
          <Card 
            className="
              relative overflow-hidden
              border-2 border-primary/30
              bg-gradient-card
              shadow-card hover:shadow-primary
              transition-all duration-500
              group
              animate-slide-in-bottom
              h-full
            "
            role="article"
            aria-labelledby="active-challenges-title"
          >
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" aria-hidden="true" />
            
            <CardHeader className="relative z-10 pb-3 lg:pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 lg:gap-3">
                  <Target 
                    className="w-7 h-7 lg:w-8 lg:h-8 text-primary group-hover:scale-110 transition-transform" 
                    aria-hidden="true"
                  />
                  <h2 
                    id="active-challenges-title"
                    className="text-responsive-xl font-bold text-primary font-display"
                  >
                    Desafios Ativos
                  </h2>
                </div>
                {activeChallenges.length > 0 && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-body">
                    {activeChallenges.length} {activeChallenges.length === 1 ? 'desafio' : 'desafios'}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base text-text-medium-contrast font-body">
                {activeChallenges.length > 0
                  ? 'Continue seus desafios em andamento'
                  : 'Desbloqueie seu potencial máximo'}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-col">
              {activeChallenges.length > 0 ? (
                <>
                  <div className="flex-1 mb-4 space-y-3 max-h-[200px] overflow-y-auto">
                    {activeChallenges.map((challenge) => (
                      <div key={challenge.id} className="p-3 rounded-xl bg-background/50 border border-primary/20 hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg text-primary font-display">
                            {challenge.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {challenge.duration_days} dias
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary-glow text-primary-foreground font-bold text-lg py-6 font-display shadow-glow" 
                    onClick={() => navigate('/challenges')}
                  >
                    Ver Progresso
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 mb-4">
                    <p className="text-accent/80 font-body text-base leading-relaxed">
                      Você não tem nenhum desafio ativo no momento. Escolha um desafio
                      da biblioteca ou crie um personalizado.
                    </p>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary-glow text-primary-foreground font-bold text-lg py-6 font-display shadow-glow" 
                    onClick={() => navigate('/challenges')}
                  >
                    Iniciar Desafio
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Life Goals Card - REDESENHADO */}
          <Card className="
            relative overflow-hidden
            border-2 border-primary/30
            bg-gradient-card
            shadow-card hover:shadow-primary
            transition-all duration-500
            before:absolute before:inset-0 
            before:border before:border-accent/20
            before:rounded-lg before:pointer-events-none
            group
            animate-slide-in-bottom
            h-full
          ">
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-2xl font-bold text-primary font-display">Objetivos de Vida</CardTitle>
              </div>
              <CardDescription className="text-base text-text-medium-contrast font-body">
                {goals.length > 0
                  ? 'Seus sonhos em andamento'
                  : 'Defina e acompanhe seus sonhos'}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-col">
              {goals.length > 0 ? (
                <>
                  <div className="flex-1 mb-4">
                    <ul className="space-y-3">
                      {goals.map((goal) => (
                        <li
                          key={goal.id}
                          className="p-3.5 rounded-xl bg-background/50 border border-primary/20 hover:border-primary/40 transition-all hover:shadow-glow"
                        >
                          <span className="font-bold text-lg text-primary font-display">{goal.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary-glow text-primary-foreground font-bold text-lg py-6 font-display shadow-glow"
                    onClick={() => navigate('/goals')}
                  >
                    Ver Todos
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 mb-4">
                    <p className="text-accent/80 font-body text-base leading-relaxed">
                      Defina objetivos significativos e transformadores para sua vida.
                    </p>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 font-display shadow-glow"
                    onClick={() => navigate('/goals')}
                  >
                    Criar Objetivo
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas Detalhadas - REDESENHADO */}
        <Card className="border-2 border-primary/30 bg-gradient-card shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center gap-2 font-display font-black">
              <Zap className="w-6 h-6" />
              Seu Arsenal de Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {/* Posição no Ranking */}
              <div 
                className="
                  relative
                  p-6 rounded-xl
                  border-2 border-yellow-500/30
                  bg-gradient-to-br from-yellow-500/10 to-orange-500/10
                  backdrop-blur-sm
                  hover:border-yellow-500/50
                  hover:shadow-glow
                  transition-all duration-300
                  group
                "
                role="region"
                aria-label={`Estatística: ${rankingPosition ? `Posição ${rankingPosition} no ranking global` : 'Carregando ranking'}`}
              >
                <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Award className="w-16 h-16 text-yellow-500" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-4xl font-black text-yellow-600 dark:text-yellow-400 mb-2 font-display" aria-live="polite">
                    #{rankingPosition || '...'}
                  </p>
                  <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                    Ranking Global
                  </p>
                </div>
              </div>

              {/* Nível Atual */}
              <div className="
                relative
                p-6 rounded-xl
                border-2 border-accent/30
                bg-background/50
                backdrop-blur-sm
                hover:border-primary/50
                hover:shadow-glow
                transition-all duration-300
                group
              ">
                <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-16 h-16 text-primary" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-4xl font-black text-primary mb-2 font-display">
                    {stats?.level}
                  </p>
                  <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                    Nível Atual
                  </p>
                </div>
              </div>

              {/* Sequência */}
              <div className="
                relative
                p-6 rounded-xl
                border-2 border-accent/30
                bg-background/50
                backdrop-blur-sm
                hover:border-primary/50
                hover:shadow-glow
                transition-all duration-300
                group
              ">
                <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Flame className="w-16 h-16 text-accent" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-4xl font-black text-primary mb-2 font-display">
                    {stats?.current_streak}
                  </p>
                  <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                    Dias Seguidos
                  </p>
                </div>
              </div>

              {/* Melhor Sequência */}
              <div className="
                relative
                p-6 rounded-xl
                border-2 border-accent/30
                bg-background/50
                backdrop-blur-sm
                hover:border-primary/50
                hover:shadow-glow
                transition-all duration-300
                group
              ">
                <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy className="w-16 h-16 text-success" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-4xl font-black text-primary mb-2 font-display">
                    {stats?.best_streak}
                  </p>
                  <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                    Melhor Sequência
                  </p>
                </div>
              </div>

              {/* Objetivos Vencidos */}
              <div className="
                relative
                p-6 rounded-xl
                border-2 border-accent/30
                bg-background/50
                backdrop-blur-sm
                hover:border-primary/50
                hover:shadow-glow
                transition-all duration-300
                group
              ">
                <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-16 h-16 text-yellow-400" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-4xl font-black text-primary mb-2 font-display">
                    {stats?.life_goal_trophies || 0}
                  </p>
                  <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                    Objetivos Vencidos
                  </p>
                </div>
              </div>

              {/* Desafios Conquistados */}
              <div className="
                relative
                p-6 rounded-xl
                border-2 border-accent/30
                bg-background/50
                backdrop-blur-sm
                hover:border-primary/50
                hover:shadow-glow
                transition-all duration-300
                group
              ">
                <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Target className="w-16 h-16 text-primary" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-4xl font-black text-primary mb-2 font-display">
                    {stats?.challenges_completed || 0}
                  </p>
                  <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                    Desafios Conquistados
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
