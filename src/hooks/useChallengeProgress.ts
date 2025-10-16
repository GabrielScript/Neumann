import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useChallengeProgress(challengeId: string | undefined, date: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["challenge-items", challengeId],
    queryFn: async () => {
      if (!challengeId) throw new Error("No challenge ID");

      const { data, error } = await supabase
        .from("challenge_items")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("position");

      if (error) throw error;
      return data;
    },
    enabled: !!challengeId,
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["challenge-progress", challengeId, date],
    queryFn: async () => {
      if (!challengeId) throw new Error("No challenge ID");

      const { data, error } = await supabase
        .from("challenge_progress")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("date", date);

      if (error) throw error;
      return data;
    },
    enabled: !!challengeId,
  });

  // Track total XP earned today
  const [todayXP, setTodayXP] = React.useState(0);

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      if (!challengeId || !user?.id) throw new Error("Missing data");

      // Call secure Edge Function to handle XP award server-side
      const { data, error } = await supabase.functions.invoke('award-challenge-xp', {
        body: {
          challenge_id: challengeId,
          item_id: itemId,
          date,
          completed,
        },
      });

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      // Accumulate XP for today
      if (data?.xpAwarded > 0) {
        setTodayXP(prev => prev + data.xpAwarded);
      }

      if (data?.leveledUp) {
        toast({
          title: "🎉 Level Up!",
          description: `Você alcançou o nível ${data.newLevel}!`,
        });
      }

      if (data?.dayComplete) {
        toast({
          title: "✨ Dia Completo!",
          description: `+${data.xpAwarded} XP! Continue assim!`,
        });
      } else if (data?.xpAwarded > 0) {
        toast({
          title: "✅ Item Completo!",
          description: `+${data.xpAwarded} XP`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["challenge-progress", challengeId, date] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  const completedToday = progress?.filter((p) => p.completed).length || 0;
  const totalItems = items?.length || 0;
  const progressPercentage = totalItems > 0 ? (completedToday / totalItems) * 100 : 0;

  return {
    items,
    progress,
    isLoading: itemsLoading || progressLoading,
    toggleItem: toggleItemMutation.mutate,
    completedToday,
    totalItems,
    progressPercentage,
    todayXP,
  };
}
