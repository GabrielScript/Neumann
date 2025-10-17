import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award, TrendingUp, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getTrophyStage, getTrophyStageName, getXPForNextLevel } from '@/lib/xp';
import { Skeleton } from '@/components/ui/skeleton';
import trophyMunicipal from '@/assets/trophies/trophy-municipal.png';
import trophyEstadual from '@/assets/trophies/trophy-estadual.png';
import trophyRegional from '@/assets/trophies/trophy-regional.png';
import trophyNacional from '@/assets/trophies/trophy-nacional.png';
import trophyInternacional from '@/assets/trophies/trophy-internacional.png';
import trophyLifeGoal from '@/assets/trophies/trophy-life-goal.png';

interface UserStats {
  xp: number;
  level: number;
  tree_stage: string;
  life_goal_trophies: number;
}

const TrophyPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      loadStats();
    }
  }, [user, authLoading, navigate]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 max-w-4xl mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  const currentStage = getTrophyStage(stats?.level || 1);
  const xpForNextLevel = getXPForNextLevel(stats?.level || 1);
  const currentLevelXP = (stats?.level || 1) * 100 - 100;
  const progressInLevel = ((stats?.xp || 0) - currentLevelXP) / 100 * 100;

  const trophyHierarchy = [
    { stage: 'municipal', name: 'Troféu Municipal', minLevel: 1, maxLevel: 10, image: trophyMunicipal },
    { stage: 'estadual', name: 'Troféu Estadual', minLevel: 11, maxLevel: 25, image: trophyEstadual },
    { stage: 'regional', name: 'Troféu Regional', minLevel: 26, maxLevel: 45, image: trophyRegional },
    { stage: 'nacional', name: 'Troféu Nacional', minLevel: 46, maxLevel: 70, image: trophyNacional },
    { stage: 'internacional', name: 'Troféu Internacional', minLevel: 71, maxLevel: 999, image: trophyInternacional },
  ];

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto px-6 py-8">
        {/* Cabeçalho */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-black text-primary font-display mb-2">
            Meu Troféu
          </h1>
          <p className="text-accent/80 font-body text-lg">
            Acompanhe sua evolução e conquistas
          </p>
        </div>

        {/* Troféu Atual */}
        <Card className="border-2 border-primary/30 bg-gradient-card shadow-card animate-slide-in-bottom">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center gap-2 font-display">
              <Trophy className="w-6 h-6" />
              Troféu Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <img 
                src={trophyHierarchy.find(t => t.stage === currentStage)?.image} 
                alt={getTrophyStageName(currentStage)}
                className="w-32 h-32 object-contain"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-3xl font-black text-primary font-display">
                    {getTrophyStageName(currentStage)}
                  </h3>
                  <p className="text-accent/70 font-body">Nível {stats?.level}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-primary font-bold">{stats?.xp} XP</span>
                    <span className="text-accent/70">Próximo nível: {xpForNextLevel} XP</span>
                  </div>
                  <Progress value={progressInLevel} className="h-3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hierarquia de Troféus */}
        <Card className="border-2 border-primary/30 bg-gradient-card shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center gap-2 font-display">
              <TrendingUp className="w-6 h-6" />
              Hierarquia de Troféus
            </CardTitle>
            <CardDescription className="font-body">
              Evolua através dos níveis para conquistar troféus maiores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trophyHierarchy.map((trophy) => {
                const isUnlocked = (stats?.level || 0) >= trophy.minLevel;
                const isCurrent = trophy.stage === currentStage;
                
                return (
                  <div
                    key={trophy.stage}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${isCurrent 
                        ? 'border-primary bg-primary/10 shadow-glow' 
                        : isUnlocked
                          ? 'border-primary/30 bg-background/50'
                          : 'border-muted/30 bg-muted/5 opacity-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={trophy.image} 
                        alt={trophy.name}
                        className="w-16 h-16 object-contain"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-primary font-display">
                          {trophy.name}
                        </h4>
                        <p className="text-sm text-accent/70 font-body">
                          Níveis {trophy.minLevel} - {trophy.maxLevel === 999 ? '∞' : trophy.maxLevel}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold font-body">
                          Atual
                        </span>
                      )}
                      {isUnlocked && !isCurrent && (
                        <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-bold font-body">
                          Conquistado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Objetivos Especiais */}
        <Card className="border-2 border-primary/30 bg-gradient-card shadow-card animate-fade-in max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center gap-2 font-display">
                <Award className="w-5 h-5" />
                Objetivos Especiais
              </CardTitle>
              <CardDescription className="font-body">
                Objetivos de vida conquistados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <img 
                  src={trophyLifeGoal} 
                  alt="Troféu Especial"
                  className="w-24 h-24 object-contain mx-auto mb-4"
                />
                <p className="text-5xl font-black text-primary font-display mb-2">
                  {stats?.life_goal_trophies || 0}
                </p>
                <p className="text-accent/70 font-body">
                  Objetivos de Vida Concluídos
                </p>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-accent/70 font-body text-center">
                  Cada objetivo de vida concluído te garante um troféu especial permanente
                </p>
              </div>
            </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TrophyPage;
