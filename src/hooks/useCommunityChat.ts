import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  community_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const useCommunityChat = (communityId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['community-chat', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_chat_messages')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar nomes dos autores das mensagens
      const messagesWithProfiles = await Promise.all(
        data.map(async (message) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', message.user_id)
            .single();

          return {
            ...message,
            profiles: profile,
          };
        })
      );

      return messagesWithProfiles as ChatMessage[];
    },
    enabled: !!communityId && !!user?.id,
  });

  useEffect(() => {
    if (!communityId) return;

    const channel = supabase
      .channel(`community-chat-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_chat_messages',
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            ['community-chat', communityId],
            (old: ChatMessage[] | undefined) => {
              if (!old) return [payload.new as ChatMessage];
              return [...old, payload.new as ChatMessage];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase
        .from('community_chat_messages')
        .insert({
          community_id: communityId,
          user_id: user?.id,
          message,
        });

      if (error) throw error;
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
  };
};
