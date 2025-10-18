import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TrendingUp, Trophy, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTrophyStage } from '@/lib/xp';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserStats {
  level: number;
  current_streak: number;
  tree_stage: string;
}

export const TopBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const { subscription } = useSubscription();
  const isMobile = useIsMobile();

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
    <header 
      className="
        h-14 lg:h-16 
        border-b-2 border-primary/20 
        bg-card/50 backdrop-blur-sm 
        flex items-center justify-between 
        pl-0 pr-3 sm:pr-4 lg:pr-6
        sticky top-0 z-40
        w-full
      "
      role="banner"
    >
      <div className="flex items-center pl-3 sm:pl-4 lg:pl-6">
        <SidebarTrigger 
          aria-label="Alternar menu lateral"
          className="touch-target"
        />
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
        {stats && (
          <>
            {isMobile ? (
              <>
                {/* Versão Mobile Compacta */}
                <div className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="font-bold text-base text-primary font-display">
                      Nv. {stats.level}
                    </span>
                  </div>
                </div>

                <div 
                  className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm cursor-pointer hover:bg-background/90 transition-colors touch-target"
                  onClick={() => navigate('/subscriptions')}
                  role="button"
                  aria-label={`Plano atual: ${getPlanDisplayName()}. Clique para ver outros planos`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/subscriptions')}
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="font-bold text-xs text-primary font-body">
                      {getPlanDisplayName()}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Versão Desktop Completa */}
                <div className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-muted-foreground font-body">Nível</p>
                      <p 
                        className="font-bold text-lg text-primary font-display"
                        aria-label={`Nível ${stats.level}`}
                      >
                        {stats.level}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-success/70 font-body">Troféu</p>
                      <p className="font-bold text-sm text-primary font-body">
                        {getTrophyStageName(stats.level)}
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow cursor-pointer hover:bg-background/90 transition-colors touch-target"
                  onClick={() => navigate('/subscriptions')}
                  role="button"
                  aria-label={`Plano atual: ${getPlanDisplayName()}. Clique para ver outros planos`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/subscriptions')}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-success/70 font-body">Plano</p>
                      <p className="font-bold text-sm text-primary font-body">
                        {getPlanDisplayName()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <UserProfileDropdown />
          </>
        )}
      </div>
    </header>
  );
};