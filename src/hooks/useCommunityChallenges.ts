import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CommunityChallenge {
  id: string;
  community_id: string | null;
  template_id: string;
  created_by: string;
  status: string;
  is_global: boolean;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  challenge_templates?: {
    name: string;
    description: string;
  };
  profiles?: {
    full_name: string;
  };
}

export const useCommunityChallenges = (communityId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['community-challenges', communityId],
    queryFn: async () => {
      let query = supabase
        .from('community_challenges')
        .select('*, challenge_templates(name, description)');

      if (communityId) {
        query = query.eq('community_id', communityId);
      } else {
        query = query.eq('is_global', true);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Buscar nomes dos criadores
      const challengesWithProfiles = await Promise.all(
        data.map(async (challenge) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', challenge.created_by)
            .single();

          return {
            ...challenge,
            profiles: profile,
          };
        })
      );

      return challengesWithProfiles as CommunityChallenge[];
    },
    enabled: !!user?.id,
  });

  const { data: pendingChallenges } = useQuery({
    queryKey: ['pending-challenges', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_challenges')
        .select('*, challenge_templates(name, description)')
        .eq('community_id', communityId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos criadores
      const challengesWithProfiles = await Promise.all(
        data.map(async (challenge) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', challenge.created_by)
            .single();

          return {
            ...challenge,
            profiles: profile,
          };
        })
      );

      return challengesWithProfiles as CommunityChallenge[];
    },
    enabled: !!communityId && !!user?.id,
  });

  const createChallengeMutation = useMutation({
    mutationFn: async ({
      templateId,
      isGlobal,
      communityId,
    }: {
      templateId: string;
      isGlobal: boolean;
      communityId?: string;
    }) => {
      const { error } = await supabase
        .from('community_challenges')
        .insert({
          template_id: templateId,
          is_global: isGlobal,
          community_id: isGlobal ? null : communityId,
          created_by: user?.id,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-challenges'] });
      toast({
        title: 'Desafio criado!',
        description: 'Seu desafio foi criado e aguarda aprovação.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar desafio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from('community_challenges')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', challengeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['pending-challenges'] });
      toast({
        title: 'Desafio aprovado!',
        description: 'O desafio foi aprovado e está disponível para todos.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao aprovar desafio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from('community_challenges')
        .update({ status: 'rejected' })
        .eq('id', challengeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['pending-challenges'] });
      toast({
        title: 'Desafio rejeitado',
        description: 'O desafio foi rejeitado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao rejeitar desafio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    challenges,
    pendingChallenges,
    isLoading,
    createChallenge: createChallengeMutation.mutate,
    approveChallenge: approveChallengeMutation.mutate,
    rejectChallenge: rejectChallengeMutation.mutate,
  };
};
