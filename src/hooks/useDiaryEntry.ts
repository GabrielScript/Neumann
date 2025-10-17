import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

export interface DiaryEntry {
  id?: string;
  challenge_id: string;
  user_id: string;
  date: string;
  day_number: number;
  reason_to_live?: string;
  world_contribution?: string;
  change_past?: string;
  action_1?: string;
  action_2?: string;
  action_3?: string;
  action_4?: string;
  action_5?: string;
  action_6?: string;
  actions_belief_score?: number;
  actions_belief_arguments?: string;
  gratitude_1?: string;
  gratitude_2?: string;
  gratitude_3?: string;
  forgiveness_completed: boolean;
  learnings?: string;
}

export function useDiaryEntry(challengeId: string, challengeStartDate: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  // Calcular número do dia baseado na data de início do desafio
  const calculateDayNumber = (date: string) => {
    const daysDiff = differenceInDays(new Date(date), new Date(challengeStartDate));
    return daysDiff + 1;
  };

  // Buscar entrada do diário para hoje
  const { data: todayEntry, isLoading } = useQuery({
    queryKey: ["diary-entry", challengeId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_diary_entries")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("date", today)
        .maybeSingle();

      if (error) throw error;
      return data as DiaryEntry | null;
    },
    enabled: !!user && !!challengeId,
  });

  // Buscar histórico de entradas
  const { data: history } = useQuery({
    queryKey: ["diary-history", challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_diary_entries")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as DiaryEntry[];
    },
    enabled: !!user && !!challengeId,
  });

  // Salvar ou atualizar entrada do diário
  const saveDiaryMutation = useMutation({
    mutationFn: async (entry: Omit<DiaryEntry, "id" | "user_id">) => {
      if (!user) throw new Error("User not authenticated");

      const dayNumber = calculateDayNumber(entry.date);
      const entryData = {
        ...entry,
        user_id: user.id,
        day_number: dayNumber,
      };

      // Verificar se já existe entrada para hoje
      if (todayEntry?.id) {
        const { data, error } = await supabase
          .from("challenge_diary_entries")
          .update(entryData)
          .eq("id", todayEntry.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("challenge_diary_entries")
          .insert(entryData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entry", challengeId] });
      queryClient.invalidateQueries({ queryKey: ["diary-history", challengeId] });
      queryClient.invalidateQueries({ queryKey: ["challenge-progress", challengeId] });
      
      // Marcar item do checklist como completo
      const { data: items } = await supabase
        .from("challenge_items")
        .select("id")
        .eq("challenge_id", challengeId);

      if (items && items.length > 0) {
        const itemId = items[0].id;
        
        // Verificar se já existe progresso para hoje
        const { data: existingProgress } = await supabase
          .from("challenge_progress")
          .select("*")
          .eq("challenge_id", challengeId)
          .eq("item_id", itemId)
          .eq("date", today)
          .maybeSingle();

        if (!existingProgress) {
          await supabase
            .from("challenge_progress")
            .insert({
              challenge_id: challengeId,
              item_id: itemId,
              date: today,
              completed: true,
            });
        } else if (!existingProgress.completed) {
          await supabase
            .from("challenge_progress")
            .update({ completed: true })
            .eq("id", existingProgress.id);
        }
      }

      toast.success("Diário salvo com sucesso! 🎉", {
        description: "Seu progresso foi registrado.",
      });
    },
    onError: (error: Error) => {
      console.error("Error saving diary:", error);
      toast.error("Erro ao salvar diário", {
        description: error.message,
      });
    },
  });

  return {
    todayEntry,
    history,
    isLoading,
    saveDiary: saveDiaryMutation.mutate,
    isSaving: saveDiaryMutation.isPending,
    calculateDayNumber,
  };
}
