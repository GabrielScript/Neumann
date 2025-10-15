import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useLifeGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: goals, isLoading, error } = useQuery({
    queryKey: ["life-goals", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("life_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goal: {
      title: string;
      deadline?: string;
      happiness_level?: number;
      motivation?: string;
      action_plan?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("life_goals")
        .insert({
          ...goal,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-goals"] });
      toast({
        title: "✅ Objetivo criado!",
        description: "Seu novo objetivo foi adicionado com sucesso.",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from("life_goals")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-goals"] });
      toast({
        title: "✅ Objetivo atualizado!",
      });
    },
  });

  const completeGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Call secure Edge Function to complete goal and award XP/trophy server-side
      const { data, error } = await supabase.functions.invoke('complete-life-goal', {
        body: {
          goal_id: goalId,
        },
      });

      if (error) throw error;

      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["life-goals"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      
      if (result.blocked) {
        toast({
          title: "⚠️ Limite Atingido",
          description: "Você atingiu o limite de nível do plano gratuito. Faça upgrade para continuar!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "🎉 Parabéns!",
          description: `Objetivo concluído! +${result.xpAwarded} XP e Troféu Especial conquistado!${result.leveledUp ? ` | Nível ${result.newLevel}!` : ''}`,
        });
      }
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("life_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-goals"] });
      toast({
        title: "Objetivo removido",
      });
    },
  });

  const activeGoals = goals?.filter((g) => !g.is_completed) || [];
  const completedGoals = goals?.filter((g) => g.is_completed) || [];

  return {
    goals,
    activeGoals,
    completedGoals,
    isLoading,
    error,
    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    completeGoal: completeGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
  };
}
