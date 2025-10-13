import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, TrendingUp, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getTrophyStage, getTrophyStageName, getXPForNextLevel } from '@/lib/xp';
import { Skeleton } from '@/components/ui/skeleton';

interface UserStats {
  xp: number;
  level: number;
  tree_stage: string;
  daily_medals_gold: number;
  daily_medals_silver: number;
  daily_medals_bronze: number;
  life_goal_trophies: number;
}

const TrophyPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

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
    { stage: 'municipal', name: 'Troféu Municipal', minLevel: 1, maxLevel: 10, icon: '🏆' },
    { stage: 'estadual', name: 'Troféu Estadual', minLevel: 11, maxLevel: 25, icon: '🥇' },
    { stage: 'regional', name: 'Troféu Regional', minLevel: 26, maxLevel: 45, icon: '🏅' },
    { stage: 'nacional', name: 'Troféu Nacional', minLevel: 46, maxLevel: 70, icon: '👑' },
    { stage: 'internacional', name: 'Troféu Internacional', minLevel: 71, maxLevel: 999, icon: '🌟' },
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
              <div className="text-8xl">{trophyHierarchy.find(t => t.stage === currentStage)?.icon}</div>
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
                      <div className="text-4xl">{trophy.icon}</div>
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

        {/* Grid de Conquistas */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Medalhas Diárias */}
          <Card className="border-2 border-primary/30 bg-gradient-card shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center gap-2 font-display">
                <Medal className="w-5 h-5" />
                Medalhas Diárias
              </CardTitle>
              <CardDescription className="font-body">
                Conquistas por completar desafios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🥇</span>
                    <span className="font-bold text-primary font-body">Ouro</span>
                  </div>
                  <span className="text-2xl font-black text-primary font-display">
                    {stats?.daily_medals_gold || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🥈</span>
                    <span className="font-bold text-primary font-body">Prata</span>
                  </div>
                  <span className="text-2xl font-black text-primary font-display">
                    {stats?.daily_medals_silver || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🥉</span>
                    <span className="font-bold text-primary font-body">Bronze</span>
                  </div>
                  <span className="text-2xl font-black text-primary font-display">
                    {stats?.daily_medals_bronze || 0}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-accent/70 font-body">
                  <strong className="text-primary">🥇 Ouro:</strong> Completou todos os desafios do dia<br/>
                  <strong className="text-primary">🥈 Prata:</strong> Completou alguns desafios<br/>
                  <strong className="text-primary">🥉 Bronze:</strong> Não completou nenhum desafio
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Troféus de Objetivos de Vida */}
          <Card className="border-2 border-primary/30 bg-gradient-card shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center gap-2 font-display">
                <Award className="w-5 h-5" />
                Troféus Especiais
              </CardTitle>
              <CardDescription className="font-body">
                Conquistas por completar objetivos de vida
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🏆</div>
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
      </div>
    </Layout>
  );
};

export default TrophyPage;
