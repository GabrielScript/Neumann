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
    duration_days: number;
  };
  profiles?: {
    full_name: string;
  };
  communities?: {
    name: string;
  };
}

export const useCommunityChallenges = (communityId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Desafios da comunidade atual ou globais
  const { data: challenges, isLoading } = useQuery({
    queryKey: ['community-challenges', communityId],
    queryFn: async () => {
      let query = supabase
        .from('community_challenges')
        .select('*, challenge_templates(name, description, duration_days)');

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

  // Desafios globais aprovados (para biblioteca)
  const { data: globalChallenges } = useQuery({
    queryKey: ['global-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_challenges')
        .select('*, challenge_templates(name, description, duration_days)')
        .eq('is_global', true)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

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

  // Desafios das comunidades do usuário (para biblioteca)
  const { data: userCommunityChallenges } = useQuery({
    queryKey: ['user-community-challenges'],
    queryFn: async () => {
      // Buscar comunidades do usuário
      const { data: memberships, error: memberError } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user?.id);

      if (memberError) throw memberError;

      const communityIds = memberships.map(m => m.community_id);

      if (communityIds.length === 0) return [];

      // Buscar desafios aprovados dessas comunidades
      const { data, error } = await supabase
        .from('community_challenges')
        .select('*, challenge_templates(name, description, duration_days), communities(name)')
        .in('community_id', communityIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      return challengesWithProfiles;
    },
    enabled: !!user?.id,
  });

  const { data: pendingChallenges } = useQuery({
    queryKey: ['pending-challenges', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_challenges')
        .select('*, challenge_templates(name, description, duration_days)')
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
    globalChallenges,
    userCommunityChallenges,
    isLoading,
    createChallenge: createChallengeMutation.mutate,
    approveChallenge: approveChallengeMutation.mutate,
    rejectChallenge: rejectChallengeMutation.mutate,
  };
};
