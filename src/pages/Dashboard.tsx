import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, TrendingUp, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserStats {
  xp: number;
  level: number;
  current_streak: number;
  best_streak: number;
  tree_stage: string;
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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
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

  const getXPForNextLevel = (level: number) => {
    return level * 100; // Simple formula: 100 XP per level
  };

  const getTreeStageName = (stage: string) => {
    const stageNames: { [key: string]: string } = {
      seed: 'Semente',
      sprout: 'Broto',
      young: 'Árvore Jovem',
      flourish: 'Árvore Frondosa',
      splendid: 'Árvore Esplêndida',
    };
    return stageNames[stage] || stage;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </Layout>
    );
  }

  const xpForNext = getXPForNextLevel(stats?.level || 1);
  const xpProgress = ((stats?.xp || 0) / xpForNext) * 100;

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header with Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold animate-fade-in">
              Bem-vindo de volta! 🌱
            </h1>
            <p className="text-muted-foreground mt-2">
              Continue sua jornada de transformação
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg shadow-card">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Nível</p>
                <p className="font-bold text-lg">{stats?.level}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg shadow-card">
              <Flame className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Sequência</p>
                <p className="font-bold text-lg">{stats?.current_streak} dias</p>
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <Card className="shadow-card animate-scale-in">
          <CardHeader>
            <CardTitle className="text-lg">Progresso de XP</CardTitle>
            <CardDescription>
              {stats?.xp} / {xpForNext} XP para o próximo nível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={xpProgress} className="h-3" />
            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>{getTreeStageName(stats?.tree_stage || 'seed')}</span>
              <span>Nível {(stats?.level || 1) + 1}</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Challenge Card */}
          <Card className="shadow-card hover:shadow-primary transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  <CardTitle>Desafio Ativo</CardTitle>
                </div>
                {activeChallenge && (
                  <Badge variant="secondary">
                    {activeChallenge.duration_days} dias
                  </Badge>
                )}
              </div>
              <CardDescription>
                {activeChallenge
                  ? 'Continue seu desafio atual'
                  : 'Desbloqueie seu potencial'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeChallenge ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {activeChallenge.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Iniciado em {new Date(activeChallenge.start_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/challenges')}
                  >
                    Ver Progresso
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Você não tem nenhum desafio ativo no momento. Escolha um desafio
                    da biblioteca ou crie um personalizado.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/challenges')}
                  >
                    Iniciar Desafio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Life Goals Card */}
          <Card className="shadow-card hover:shadow-primary transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-accent" />
                <CardTitle>Objetivos de Vida</CardTitle>
              </div>
              <CardDescription>
                {goals.length > 0
                  ? 'Seus sonhos em andamento'
                  : 'Defina e acompanhe seus sonhos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {goals.length > 0 ? (
                <div className="space-y-4">
                  <ul className="space-y-2">
                    {goals.map((goal) => (
                      <li
                        key={goal.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium">{goal.title}</span>
                        {goal.deadline && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/goals')}
                  >
                    Ver Todos
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Defina objetivos significativos e transformadores para sua vida.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/goals')}
                  >
                    Criar Objetivo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-primary">{stats?.level}</p>
                <p className="text-sm text-muted-foreground">Nível Atual</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-accent">{stats?.current_streak}</p>
                <p className="text-sm text-muted-foreground">Dias Seguidos</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-success">{stats?.best_streak}</p>
                <p className="text-sm text-muted-foreground">Melhor Sequência</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{stats?.xp}</p>
                <p className="text-sm text-muted-foreground">XP Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
