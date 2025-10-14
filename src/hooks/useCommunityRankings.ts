import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankingEntry {
  position: number;
  userId: string;
  userName: string;
  value: number;
  trophyStage: string;
  isPlus: boolean;
  medal?: '🥇' | '🥈' | '🥉';
}

interface RawMemberData {
  user_id: string;
  profiles: {
    full_name: string;
  };
  user_stats: {
    level: number;
    current_streak: number;
    best_streak: number;
    life_goal_trophies: number;
    challenges_completed: number;
    tree_stage: string;
  };
  user_subscriptions: {
    tier: string;
  } | null;
}

export function useCommunityRankings(communityId: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ["community-rankings", communityId],
    queryFn: async () => {
      if (!communityId) throw new Error("Community ID is required");

      const { data: membersData, error } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityId);

      if (error) throw error;
      if (!membersData || membersData.length === 0) {
        return {
          levelRanking: [],
          currentStreakRanking: [],
          bestStreakRanking: [],
          lifeGoalTrophiesRanking: [],
          challengesCompletedRanking: [],
        };
      }

      // Get user IDs
      const userIds = membersData.map(m => m.user_id);

      // Fetch all data separately
      const [profilesData, statsData, subscriptionsData] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", userIds),
        supabase.from("user_stats").select("user_id, level, current_streak, best_streak, life_goal_trophies, challenges_completed, tree_stage").in("user_id", userIds),
        supabase.from("user_subscriptions").select("user_id, tier").in("user_id", userIds),
      ]);

      // Process rankings for each category
      const processRanking = (valueKey: 'level' | 'current_streak' | 'best_streak' | 'life_goal_trophies' | 'challenges_completed'): RankingEntry[] => {
        const sorted = userIds
          .map(userId => {
            const profile = profilesData.data?.find(p => p.id === userId);
            const stats = statsData.data?.find(s => s.user_id === userId);
            const subscription = subscriptionsData.data?.find(s => s.user_id === userId);
            
            return {
              userId,
              userName: profile?.full_name || 'Usuário',
              value: (stats?.[valueKey] as number) || 0,
              trophyStage: stats?.tree_stage || 'municipal',
              isPlus: subscription?.tier !== 'free' && !!subscription?.tier,
            };
          })
          .sort((a, b) => b.value - a.value)
          .map((entry, index) => ({
            ...entry,
            position: index + 1,
            medal: (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : undefined) as '🥇' | '🥈' | '🥉' | undefined,
          }));

        return sorted;
      };

      return {
        levelRanking: processRanking('level'),
        currentStreakRanking: processRanking('current_streak'),
        bestStreakRanking: processRanking('best_streak'),
        lifeGoalTrophiesRanking: processRanking('life_goal_trophies'),
        challengesCompletedRanking: processRanking('challenges_completed'),
      };
    },
    enabled: !!communityId,
  });

  return {
    levelRanking: data?.levelRanking || [],
    currentStreakRanking: data?.currentStreakRanking || [],
    bestStreakRanking: data?.bestStreakRanking || [],
    lifeGoalTrophiesRanking: data?.lifeGoalTrophiesRanking || [],
    challengesCompletedRanking: data?.challengesCompletedRanking || [],
    isLoading,
  };
}
