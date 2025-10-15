import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CommunityRole, CommunityMember } from './useCommunity';

export const useCommunityMembers = (communityId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .order('role', { ascending: true });

      if (error) throw error;

      // Buscar nomes dos membros
      const membersWithProfiles = await Promise.all(
        data.map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', member.user_id)
            .single();

          return {
            ...member,
            profiles: profile,
          };
        })
      );

      return membersWithProfiles as CommunityMember[];
    },
    enabled: !!communityId && !!user?.id,
  });

  const { data: userRole } = useQuery({
    queryKey: ['user-role', communityId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data.role as CommunityRole;
    },
    enabled: !!communityId && !!user?.id,
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: CommunityRole }) => {
      const { error } = await supabase
        .from('community_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
      toast({
        title: 'Role atualizado!',
        description: 'O role do membro foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
      toast({
        title: 'Membro removido',
        description: 'O membro foi removido da comunidade.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover membro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const canPromoteToLeader = async () => {
    if (!communityId) return false;
    
    const { data, error } = await supabase.rpc('check_leader_limit', {
      p_community_id: communityId,
    });

    if (error) throw error;
    return data;
  };

  return {
    members,
    userRole,
    isLoading,
    updateMemberRole: updateMemberRoleMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    canPromoteToLeader,
  };
};
