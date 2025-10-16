import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface JoinRequest {
  id: string;
  community_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  profiles?: {
    full_name: string;
  };
}

export function useJoinRequests(communityId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["join-requests", communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_join_requests")
        .select(`
          id,
          community_id,
          user_id,
          status,
          created_at,
          reviewed_at,
          reviewed_by
        `)
        .eq("community_id", communityId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar perfis separadamente
      const userIds = data?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      return data?.map(request => ({
        ...request,
        profiles: profiles?.find(p => p.id === request.user_id),
      })) as JoinRequest[];
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("community_join_requests")
        .insert({
          community_id: communityId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description: "Aguarde a aprovação do líder da comunidade.",
      });
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reviewRequestMutation = useMutation({
    mutationFn: async ({ requestId, approved }: { requestId: string; approved: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Atualizar status da solicitação
      const { data: request, error: updateError } = await supabase
        .from("community_join_requests")
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Se aprovado, adicionar membro à comunidade
      if (approved && request) {
        const { error: memberError } = await supabase
          .from("community_members")
          .insert({
            community_id: request.community_id,
            user_id: request.user_id,
            role: 'novice',
          });

        if (memberError) throw memberError;
      }
    },
    onSuccess: (_, { approved }) => {
      toast({
        title: approved ? "Solicitação aprovada" : "Solicitação recusada",
        description: approved 
          ? "O usuário foi adicionado à comunidade."
          : "A solicitação foi recusada.",
      });
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    requests: requests || [],
    isLoading,
    createRequest: createRequestMutation.mutate,
    reviewRequest: reviewRequestMutation.mutate,
  };
}
