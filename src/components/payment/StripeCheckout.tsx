import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface StripeCheckoutProps {
  priceId: string;
  planName: string;
  onClose?: () => void;
}

export const StripeCheckout = ({ priceId, planName, onClose }: StripeCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      console.log('[CHECKOUT] ====== STARTING CHECKOUT ======');
      console.log('[CHECKOUT] Current URL:', window.location.href);
      console.log('[CHECKOUT] Plan:', planName);
      console.log('[CHECKOUT] Price ID:', priceId);
      console.log('[CHECKOUT] Timestamp:', new Date().toISOString());

      const { data: { session } } = await supabase.auth.getSession();
      console.log('[CHECKOUT] Session exists:', !!session);
      console.log('[CHECKOUT] Session user:', session?.user?.email);
      
      if (!session) {
        throw new Error('Você precisa estar logado para fazer uma assinatura');
      }

      console.log('[CHECKOUT] ✓ Session validated');
      console.log('[CHECKOUT] Calling create-checkout edge function...');
      console.log('[CHECKOUT] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // Adicionar timeout de 30 segundos
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: A requisição demorou mais de 30 segundos')), 30000)
      );

      const invokePromise = supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      console.log('[CHECKOUT] Invoke function called, waiting for response...');
      
      const result = await Promise.race([invokePromise, timeoutPromise]) as Awaited<typeof invokePromise>;
      const { data, error } = result;

      console.log('[CHECKOUT] ====== FUNCTION RESPONSE ======');
      console.log('[CHECKOUT] Data:', data);
      console.log('[CHECKOUT] Error:', error);
      console.log('[CHECKOUT] Full result:', result);

      if (error) {
        console.error('Function error:', error);
        
        // Tratamento de erro mais específico
        if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
          throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
        }
        
        if (error.message?.includes('Timeout')) {
          throw new Error('A requisição demorou muito tempo. Tente novamente.');
        }
        
        throw new Error(error.message || 'Erro ao criar sessão de checkout');
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não foi retornada');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h3 className="text-xl font-semibold">Assinar {planName}</h3>
      <p className="text-sm text-muted-foreground text-center">
        Você será redirecionado para o checkout seguro do Stripe
      </p>
      <Button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          'Continuar para Pagamento'
        )}
      </Button>
    </div>
  );
};
