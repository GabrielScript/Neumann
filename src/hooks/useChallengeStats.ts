import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useChallengeStats(challengeId: string | undefined) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["challenge-stats", challengeId],
    queryFn: async () => {
      if (!challengeId) throw new Error("No challenge ID");

      const { data, error } = await supabase
        .from("challenges")
        .select("completed_days, duration_days")
        .eq("id", challengeId)
        .single();

      if (error) throw error;

      const completedDays = data.completed_days || 0;
      const totalDays = data.duration_days;
      const remainingDays = totalDays - completedDays;
      const progressPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

      return {
        completedDays,
        totalDays,
        remainingDays,
        progressPercentage,
      };
    },
    enabled: !!challengeId,
  });

  return {
    stats,
    isLoading,
  };
}
