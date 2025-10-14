import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TrendingUp, Flame, Trophy, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTrophyStage } from '@/lib/xp';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface UserStats {
  level: number;
  current_streak: number;
  tree_stage: string;
}

export const TopBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const { subscription, getFeatures, getTierBadgeColor } = useSubscription();

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    const { data } = await supabase
      .from('user_stats')
      .select('level, current_streak, tree_stage')
      .eq('user_id', user?.id)
      .single();
    
    if (data) setStats(data);
  };

  const getTrophyStageName = (level: number) => {
    const stage = getTrophyStage(level);
    const stageNames: { [key: string]: string } = {
      municipal: 'Municipal',
      estadual: 'Estadual',
      regional: 'Regional',
      nacional: 'Nacional',
      internacional: 'Internacional',
    };
    return stageNames[stage] || stage;
  };

  const getPlanDisplayName = () => {
    if (!subscription?.tier) return 'Free';
    switch (subscription.tier) {
      case 'free':
        return 'Free';
      case 'plus_monthly':
        return 'Plus Mensal';
      case 'plus_annual':
        return 'Plus Anual';
      default:
        return 'Free';
    }
  };

  return (
    <header className="h-16 border-b-2 border-primary/20 bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <SidebarTrigger />
      
      <div className="flex items-center gap-3">
        {stats && (
          <>
            <div className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-success/70 font-body">Nível</p>
                  <p className="font-bold text-lg text-primary font-display">{stats.level}</p>
                </div>
              </div>
            </div>

            <div className="border-2 border-accent/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-xs text-accent/70 font-body">Sequência</p>
                  <p className="font-bold text-lg text-primary font-display">{stats.current_streak}d</p>
                </div>
              </div>
            </div>

            <div className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-success/70 font-body">Troféu</p>
                  <p className="font-bold text-sm text-primary font-body">{getTrophyStageName(stats.level)}</p>
                </div>
              </div>
            </div>

            <div 
              className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow cursor-pointer hover:bg-background/90 transition-colors"
              onClick={() => navigate('/subscriptions')}
              title="Ver planos"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-success/70 font-body">Plano</p>
                  <p className="font-bold text-sm text-primary font-body">{getPlanDisplayName()}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
