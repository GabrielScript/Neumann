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
      console.log(`Starting checkout for ${planName} with price ${priceId}`);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar logado para fazer uma assinatura');
      }

      console.log('Session token available, calling create-checkout...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error:', error);
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
