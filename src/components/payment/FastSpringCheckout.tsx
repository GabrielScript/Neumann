import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FastSpringCheckoutProps {
  planPath: string;
  planName: string;
  onClose?: () => void;
}

// Declare FastSpring global
declare global {
  interface Window {
    fastspring?: {
      builder: {
        checkout: (config: any) => void;
        push: (config: any) => void;
      };
    };
  }
}

export const FastSpringCheckout = ({ planPath, planName, onClose }: FastSpringCheckoutProps) => {
  useEffect(() => {
    // Load FastSpring script
    const script = document.createElement('script');
    script.src = 'https://d1f8f9xcsvx3ha.cloudfront.net/sbl/0.8.5/fastspring-builder.min.js';
    script.async = true;
    script.setAttribute('data-storefront', import.meta.env.VITE_FASTSPRING_STORE_ID || 'neumann.test.onfastspring.com');
    script.setAttribute('data-data-callback', 'onFastSpringData');
    script.setAttribute('data-popup-closed', 'onFastSpringPopupClosed');
    
    document.body.appendChild(script);
    
    // Setup callbacks
    (window as any).onFastSpringData = (data: any) => {
      console.log('FastSpring data:', data);
    };
    
    (window as any).onFastSpringPopupClosed = (data: any) => {
      console.log('FastSpring popup closed:', data);
      if (data && data.completed) {
        // Payment completed successfully
        window.location.reload();
      }
      onClose?.();
    };
    
    return () => {
      document.body.removeChild(script);
      delete (window as any).onFastSpringData;
      delete (window as any).onFastSpringPopupClosed;
    };
  }, [onClose]);

  const handleCheckout = () => {
    if (window.fastspring) {
      window.fastspring.builder.push({
        reset: true,
        products: [
          {
            path: planPath,
            quantity: 1
          }
        ],
        checkout: true
      });
    } else {
      console.error('FastSpring not loaded');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h3 className="text-xl font-semibold">Assinar {planName}</h3>
      <p className="text-muted-foreground text-center">
        Você será redirecionado para o checkout seguro do FastSpring
      </p>
      <Button onClick={handleCheckout} size="lg" className="w-full">
        Continuar para Pagamento
      </Button>
    </div>
  );
};
