import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionTier = 'free' | 'plus_monthly' | 'plus_annual';

interface Subscription {
  id: string;
  tier: SubscriptionTier;
  status: string;
  started_at: string;
  expires_at: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    enabled: !!user?.id,
  });

  const checkDailyChallengeLimit = async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_daily_challenge_limit', {
      p_user_id: user?.id,
    });
    if (error) throw error;
    return data;
  };

  const checkMonthlyGoalLimit = async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_monthly_goal_limit', {
      p_user_id: user?.id,
    });
    if (error) throw error;
    return data;
  };

  const checkLevelLimit = async (newLevel: number): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_level_limit', {
      p_user_id: user?.id,
      p_new_level: newLevel,
    });
    if (error) throw error;
    return data;
  };

  const canAccessCommunity = () => {
    return subscription?.tier !== 'free';
  };

  const canAccessMedals = () => {
    return subscription?.tier !== 'free';
  };

  const refreshSubscription = async () => {
    await queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
  };

  const getFeatures = () => {
    switch (subscription?.tier) {
      case 'free':
        return {
          name: 'Neumann Free',
          dailyChallenges: 1,
          monthlyGoals: 1,
          maxLevel: 25,
          hasMedals: false,
          hasCommunity: false,
          canAdjustChallenges: false,
          canCreateChallenges: false,
        };
      case 'plus_monthly':
        return {
          name: 'Neumann Plus Mensal',
          dailyChallenges: 6,
          monthlyGoals: Infinity,
          maxLevel: Infinity,
          hasMedals: true,
          hasCommunity: true,
          canAdjustChallenges: true,
          canCreateChallenges: false,
        };
      case 'plus_annual':
        return {
          name: 'Neumann Plus Anual',
          dailyChallenges: Infinity,
          monthlyGoals: Infinity,
          maxLevel: Infinity,
          hasMedals: true,
          hasCommunity: true,
          canAdjustChallenges: true,
          canCreateChallenges: true,
        };
      default:
        return null;
    }
  };

  const getTierBadgeColor = () => {
    switch (subscription?.tier) {
      case 'free':
        return 'bg-muted text-muted-foreground';
      case 'plus_monthly':
        return 'bg-primary text-primary-foreground';
      case 'plus_annual':
        return 'bg-gradient-to-r from-primary to-accent text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return {
    subscription,
    isLoading,
    checkDailyChallengeLimit,
    checkMonthlyGoalLimit,
    checkLevelLimit,
    canAccessCommunity,
    canAccessMedals,
    getFeatures,
    getTierBadgeColor,
    refreshSubscription,
  };
};
