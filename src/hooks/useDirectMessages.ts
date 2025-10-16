import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  community_id: string | null;
  message: string;
  created_at: string;
  read: boolean;
  sender?: {
    full_name: string;
  };
  receiver?: {
    full_name: string;
  };
}

export const useDirectMessages = (communityId: string | undefined, otherUserId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['direct-messages', communityId, otherUserId],
    queryFn: async () => {
      if (!otherUserId || !user?.id) return [];

      let query = supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      // Se communityId for undefined/null, busca mensagens globais
      if (communityId) {
        query = query.eq('community_id', communityId);
      } else {
        query = query.is('community_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar perfis dos usuários
      const messagesWithProfiles = await Promise.all(
        data.map(async (msg) => {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', msg.sender_id)
            .single();

          const { data: receiverProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', msg.receiver_id)
            .single();

          return {
            ...msg,
            sender: senderProfile,
            receiver: receiverProfile,
          };
        })
      );

      return messagesWithProfiles as DirectMessage[];
    },
    enabled: !!otherUserId && !!user?.id,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!otherUserId || !user?.id) return;

    const channelName = communityId 
      ? `direct-messages-${communityId}-${otherUserId}`
      : `direct-messages-global-${otherUserId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          console.log('Direct message change:', payload);
          queryClient.invalidateQueries({ queryKey: ['direct-messages', communityId, otherUserId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, otherUserId, user?.id, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!otherUserId || !user?.id) {
        throw new Error('Dados incompletos');
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          community_id: communityId || null,
          message,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('id', messageId)
        .eq('receiver_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
  };
};
