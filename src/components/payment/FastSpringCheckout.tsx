import { useEffect, useState } from 'react';
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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load FastSpring script
    const script = document.createElement('script');
    script.id = 'fsc-api';
    script.src = 'https://d1f8f9xcsvx3ha.cloudfront.net/sbl/0.8.5/fastspring-builder.min.js';
    script.type = 'text/javascript';
    // IMPORTANT: This needs to be the FULL URL to your popup checkout
    // Format: yourstore.test.onfastspring.com/popup-checkout
    // Get this from FastSpring: Checkouts > Popup Checkouts > Place on your Website
    const storefrontUrl = import.meta.env.VITE_FASTSPRING_STORE_ID || 'neumann.test.onfastspring.com/popup-neumann';
    script.setAttribute('data-storefront', storefrontUrl);
    script.setAttribute('data-data-callback', 'onFastSpringData');
    script.setAttribute('data-popup-closed', 'onFastSpringPopupClosed');
    
    script.onload = () => {
      console.log('FastSpring script loaded successfully');
      setIsScriptLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load FastSpring script');
    };
    
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
    if (!isScriptLoaded || !window.fastspring) {
      console.error('FastSpring not ready yet');
      return;
    }
    
    setIsProcessing(true);
    try {
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
    } catch (error) {
      console.error('Error opening FastSpring checkout:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h3 className="text-xl font-semibold">Assinar {planName}</h3>
      <p className="text-muted-foreground text-center">
        Você será redirecionado para o checkout seguro do FastSpring
      </p>
      <Button 
        onClick={handleCheckout} 
        size="lg" 
        className="w-full"
        disabled={!isScriptLoaded || isProcessing}
      >
        {!isScriptLoaded ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Abrindo checkout...
          </>
        ) : (
          'Continuar para Pagamento'
        )}
      </Button>
    </div>
  );
};
