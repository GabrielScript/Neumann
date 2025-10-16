import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useOnboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: ['onboarding', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user found');

      const { data: existing } = await supabase
        .from('user_onboarding')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_onboarding')
          .update({ completed: true })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user.id, completed: true });

        if (error) throw error;
      }
      
      // Return the completed status
      return { completed: true };
    },
    onSuccess: () => {
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ['onboarding', user?.id] });
      queryClient.refetchQueries({ queryKey: ['onboarding', user?.id] });
    },
  });

  return {
    onboardingStatus,
    isLoading,
    completeOnboarding: completeOnboarding.mutateAsync,
    isCompleting: completeOnboarding.isPending,
  };
};
