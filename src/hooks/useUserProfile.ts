import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  full_name: string;
  level: number;
  xp: number;
  current_streak: number;
  best_streak: number;
  tree_stage: string;
  life_goal_trophies: number;
  challenges_completed: number;
  daily_medals_gold: number;
  daily_medals_silver: number;
  daily_medals_bronze: number;
  tier: string;
}

export function useUserProfile(userId: string | null) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      // Fetch stats
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Fetch subscription
      const { data: subscriptionData } = await supabase
        .from("user_subscriptions")
        .select("tier")
        .eq("user_id", userId)
        .maybeSingle();

      return {
        id: profileData.id,
        full_name: profileData.full_name,
        level: statsData?.level || 1,
        xp: statsData?.xp || 0,
        current_streak: statsData?.current_streak || 0,
        best_streak: statsData?.best_streak || 0,
        tree_stage: statsData?.tree_stage || 'municipal',
        life_goal_trophies: statsData?.life_goal_trophies || 0,
        challenges_completed: statsData?.challenges_completed || 0,
        daily_medals_gold: statsData?.daily_medals_gold || 0,
        daily_medals_silver: statsData?.daily_medals_silver || 0,
        daily_medals_bronze: statsData?.daily_medals_bronze || 0,
        tier: subscriptionData?.tier || 'free'
      } as UserProfile;
    },
    enabled: !!userId,
  });

  return { profile, isLoading };
}
