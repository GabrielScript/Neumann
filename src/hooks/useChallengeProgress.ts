import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { awardXP, updateStreak } from "@/lib/xp";
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

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      if (!challengeId || !user?.id) throw new Error("Missing data");

      const { data: existing, error: fetchError } = await supabase
        .from("challenge_progress")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("item_id", itemId)
        .eq("date", date)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const { error } = await supabase
          .from("challenge_progress")
          .update({ completed })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("challenge_progress")
          .insert({
            challenge_id: challengeId,
            item_id: itemId,
            date,
            completed,
          });

        if (error) throw error;
      }

      // Award XP if completing
      if (completed) {
        const result = await awardXP(user.id, 10);
        
        if (result.leveledUp) {
          toast({
            title: "🎉 Level Up!",
            description: `Você alcançou o nível ${result.newLevel}!`,
          });
        }

        // Check if all items are completed
        const { data: allProgress } = await supabase
          .from("challenge_progress")
          .select("*")
          .eq("challenge_id", challengeId)
          .eq("date", date);

        const totalItems = items?.length || 0;
        const completedItems = allProgress?.filter((p) => p.completed).length || 0;

        if (totalItems > 0 && completedItems === totalItems) {
          // Day complete bonus
          await awardXP(user.id, 50);
          await updateStreak(user.id, null);
          
          toast({
            title: "✨ Dia Completo!",
            description: "+50 XP de bônus! Continue assim!",
          });
        }

        queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge-progress", challengeId, date] });
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
  };
}
