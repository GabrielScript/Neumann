import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useActiveChallenge() {
  const { user } = useAuth();

  const { data: challenges, isLoading, error } = useQuery({
    queryKey: ["active-challenges", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("challenges")
        .select("*, difficulty, alignment_score") // Adicionado difficulty e alignment_score
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Para compatibilidade, retorna o primeiro desafio como 'challenge'
  const challenge = challenges?.[0] || null;

  return { challenge, challenges, isLoading, error };
}
