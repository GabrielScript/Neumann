import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Achievements() {
  const { user } = useAuth();

  const { data: completedChallenges, isLoading } = useQuery({
    queryKey: ['completed-challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const stats = {
    total: completedChallenges?.length || 0,
    totalDays: completedChallenges?.reduce((acc, c) => acc + (c.completed_days || 0), 0) || 0,
    avgAlignment: completedChallenges?.length 
      ? Math.round(completedChallenges.reduce((acc, c) => acc + (c.alignment_score || 0), 0) / completedChallenges.length)
      : 0,
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 8) return 'destructive';
    if (difficulty >= 5) return 'secondary';
    return 'default';
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-display font-bold">Desafios Conquistados</h1>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completados</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">desafios finalizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dias Totais</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDays}</div>
              <p className="text-xs text-muted-foreground">dias de dedicação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alinhamento Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgAlignment}/10</div>
              <p className="text-xs text-muted-foreground">pontuação média</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Desafios */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando desafios...
          </div>
        ) : !completedChallenges || completedChallenges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum desafio completado ainda
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Complete seus primeiros desafios para vê-los aqui!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {completedChallenges.map((challenge) => (
              <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{challenge.name}</CardTitle>
                      {challenge.completed_at && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Completado em {format(new Date(challenge.completed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {challenge.duration_days} dias de duração
                    </Badge>
                    <Badge variant="outline">
                      {challenge.completed_days} dias completados
                    </Badge>
                    {challenge.difficulty && (
                      <Badge variant={getDifficultyColor(challenge.difficulty)}>
                        Dificuldade: {challenge.difficulty}/10
                      </Badge>
                    )}
                    {challenge.alignment_score && (
                      <Badge 
                        className={`${getAlignmentColor(challenge.alignment_score)} text-white`}
                      >
                        Alinhamento: {challenge.alignment_score}/10
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
