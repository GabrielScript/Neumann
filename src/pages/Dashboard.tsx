import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, TrendingUp, Flame, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('Champion');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      loadDashboardData();
    }
  }, [user, authLoading, navigate]);

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

      // Load active challenge
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      setActiveChallenge(challengeData);

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

  if (loading) {
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
      <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
        {/* Saudação Personalizada */}
        <div className="flex items-center gap-3 animate-slide-in-bottom">
          <span className="text-5xl animate-wave">👋</span>
          <div>
            <h1 className="text-4xl font-black text-primary font-display">
              Olá, {userName}!
            </h1>
            <p className="text-accent mt-1 font-body text-lg">
              Pronto para conquistar seus desafios hoje?
            </p>
          </div>
        </div>

        {/* Main Content Grid - FOCO EM DESAFIOS E OBJETIVOS */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Challenge Card - REDESENHADO */}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-2xl font-bold text-primary font-display">Desafio Ativo</CardTitle>
                </div>
                {activeChallenge && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-body">
                    {activeChallenge.duration_days} dias
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base text-accent/80 font-body">
                {activeChallenge
                  ? 'Continue seu desafio atual'
                  : 'Desbloqueie seu potencial máximo'}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-col">
              {activeChallenge ? (
                <>
                  <div className="flex-1 mb-4">
                    <div className="p-3 rounded-xl bg-background/50 border border-primary/20">
                      <h3 className="font-bold text-lg mb-1 text-primary font-display">
                        {activeChallenge.name}
                      </h3>
                    </div>
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
              <CardDescription className="text-base text-accent/80 font-body">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
