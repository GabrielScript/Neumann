import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type CommunityRole = 'challenger_leader' | 'champion' | 'novice';

export interface Community {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: CommunityRole;
  joined_at: string;
  profiles?: {
    full_name: string;
  };
}

export const useCommunity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userCommunities, isLoading } = useQuery({
    queryKey: ['user-communities', user?.id],
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from('community_members')
        .select('community_id, communities(*)')
        .eq('user_id', user?.id);

      if (error) throw error;
      return memberships?.map(m => m.communities).filter((c): c is Community => c !== null) as Community[];
    },
    enabled: !!user?.id,
  });

  const { data: allCommunities } = useQuery({
    queryKey: ['all-communities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Community[];
    },
    enabled: !!user?.id,
  });

  const createCommunityMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert({
          name,
          description,
          created_by: user?.id,
        })
        .select()
        .single();

      if (communityError) throw communityError;

      // Adicionar o criador como Challenger Leader
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: user?.id,
          role: 'challenger_leader',
        });

      if (memberError) throw memberError;

      return community;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-communities'] });
      toast({
        title: 'Comunidade criada!',
        description: 'Sua comunidade foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar comunidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user?.id,
          role: 'novice',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-communities'] });
      toast({
        title: 'Entrou na comunidade!',
        description: 'Você agora é membro desta comunidade.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao entrar na comunidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-communities'] });
      toast({
        title: 'Saiu da comunidade',
        description: 'Você não é mais membro desta comunidade.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao sair da comunidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-communities'] });
      queryClient.invalidateQueries({ queryKey: ['all-communities'] });
      toast({
        title: 'Comunidade excluída',
        description: 'A comunidade foi excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir comunidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCommunityMutation = useMutation({
    mutationFn: async ({ communityId, description }: { communityId: string; description: string }) => {
      const { error } = await supabase
        .from('communities')
        .update({ description })
        .eq('id', communityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
      queryClient.invalidateQueries({ queryKey: ['user-communities'] });
      toast({
        title: 'Descrição atualizada',
        description: 'A descrição da comunidade foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar descrição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    userCommunities,
    allCommunities,
    isLoading,
    createCommunity: createCommunityMutation.mutate,
    joinCommunity: joinCommunityMutation.mutate,
    leaveCommunity: leaveCommunityMutation.mutate,
    deleteCommunity: deleteCommunityMutation.mutate,
    updateCommunity: updateCommunityMutation.mutate,
  };
};
