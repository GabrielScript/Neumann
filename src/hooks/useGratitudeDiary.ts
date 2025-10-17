import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

export interface GratitudeDiaryEntry {
  id?: string;
  challenge_id: string;
  user_id: string;
  date: string;
  day_number: number;
  gratitude_1?: string;
  gratitude_2?: string;
  gratitude_3?: string;
  created_at?: string;
  updated_at?: string;
}

export function useGratitudeDiary(challengeId: string, challengeStartDate: string) {
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
    queryKey: ["gratitude-diary-entry", challengeId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gratitude_diary_entries")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("date", today)
        .maybeSingle();

      if (error) throw error;
      return data as GratitudeDiaryEntry | null;
    },
    enabled: !!user && !!challengeId,
  });

  // Buscar histórico de entradas
  const { data: history } = useQuery({
    queryKey: ["gratitude-diary-history", challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gratitude_diary_entries")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as GratitudeDiaryEntry[];
    },
    enabled: !!user && !!challengeId,
  });

  // Salvar ou atualizar entrada do diário
  const saveGratitudeDiaryMutation = useMutation({
    mutationFn: async (entry: Omit<GratitudeDiaryEntry, "id" | "user_id">) => {
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
          .from("gratitude_diary_entries")
          .update(entryData)
          .eq("id", todayEntry.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("gratitude_diary_entries")
          .insert(entryData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["gratitude-diary-entry", challengeId] });
      queryClient.invalidateQueries({ queryKey: ["gratitude-diary-history", challengeId] });
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

      toast.success("Diário da gratidão salvo com sucesso! 🎉", {
        description: "Seu progresso foi registrado.",
      });
    },
    onError: (error: Error) => {
      console.error("Error saving gratitude diary:", error);
      toast.error("Erro ao salvar diário da gratidão", {
        description: error.message,
      });
    },
  });

  return {
    todayEntry,
    history,
    isLoading,
    saveGratitudeDiary: saveGratitudeDiaryMutation.mutate,
    isSaving: saveGratitudeDiaryMutation.isPending,
    calculateDayNumber,
  };
}
