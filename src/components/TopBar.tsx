import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TrendingUp, Trophy, CreditCard, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTrophyStage } from '@/lib/xp';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { useDailyQuote } from '@/hooks/useDailyQuote';
import { DailyQuoteModal } from '@/components/DailyQuoteModal';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/translations';

interface UserStats {
  level: number;
  current_streak: number;
  tree_stage: string;
}

export const TopBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState<UserStats | null>(null);
  const { subscription, getFeatures, getTierBadgeColor } = useSubscription();
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { quote, loading: quoteLoading } = useDailyQuote();

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
    return t(`topbar.trophyStages.${stage}`) || stage;
  };

  const getPlanDisplayName = () => {
    if (!subscription?.tier) return t('topbar.plans.free');
    switch (subscription.tier) {
      case 'free':
        return t('topbar.plans.free');
      case 'plus_monthly':
        return t('topbar.plans.plusMonthly');
      case 'plus_annual':
        return t('topbar.plans.plusAnnual');
      default:
        return t('topbar.plans.free');
    }
  };

  return (
    <>
      <header className="h-16 border-b-2 border-primary/20 bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          
          <Button
            onClick={() => setShowQuoteModal(true)}
            className="border-2 border-primary/50 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md px-5 py-2 rounded-lg shadow-glow hover:shadow-primary transition-all duration-300 group"
            variant="ghost"
          >
            <Sparkles className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm text-primary font-body hidden sm:inline">{t('topbar.dailyQuote')}</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
        {stats && (
          <>
            <div className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-5 py-2 rounded-lg shadow-glow">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-success/70 font-body">{t('topbar.level')}</p>
                  <p className="font-bold text-lg text-primary font-display">{stats.level}</p>
                </div>
              </div>
            </div>

            <div className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-5 py-2 rounded-lg shadow-glow">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-success/70 font-body">{t('topbar.trophy')}</p>
                  <p className="font-bold text-sm text-primary font-body">{getTrophyStageName(stats.level)}</p>
                </div>
              </div>
            </div>

            <div 
              className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-5 py-2 rounded-lg shadow-glow cursor-pointer hover:bg-background/90 transition-colors"
              onClick={() => navigate('/subscriptions')}
              title={t('topbar.viewPlans')}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-success/70 font-body">{t('topbar.plan')}</p>
                  <p className="font-bold text-sm text-primary font-body">{getPlanDisplayName()}</p>
                </div>
              </div>
            </div>

            <UserProfileDropdown />
          </>
        )}
        </div>
      </header>

      <DailyQuoteModal 
        open={showQuoteModal} 
        onOpenChange={setShowQuoteModal}
        quote={quote}
        loading={quoteLoading}
      />
    </>
  );
};
