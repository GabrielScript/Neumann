import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface FastSpringCheckoutProps {
  planPath: string;
  planName: string;
  onClose?: () => void;
}

export const FastSpringCheckout = ({ planPath, planName, onClose }: FastSpringCheckoutProps) => {
  const { user } = useAuth();

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.getElementById('fsc-api');
    if (existingScript) {
      console.log('FastSpring script already loaded');
      return;
    }

    // Load FastSpring script only once
    const script = document.createElement('script');
    script.id = 'fsc-api';
    script.src = 'https://d1f8f9xcsvx3ha.cloudfront.net/sbl/0.8.5/fastspring-builder.min.js';
    script.type = 'text/javascript';
    script.setAttribute('data-storefront', import.meta.env.VITE_FASTSPRING_STORE_ID || 'neumann.test.onfastspring.com');
    script.setAttribute('data-popup-closed', 'onFastSpringPopupClosed');
    
    script.onload = () => {
      console.log('FastSpring script loaded successfully');
    };
    
    document.body.appendChild(script);
    
    // Setup popup closed callback
    (window as any).onFastSpringPopupClosed = (data: any) => {
      console.log('FastSpring popup closed:', data);
      if (data && data.completed) {
        // Payment completed successfully
        window.location.reload();
      }
      onClose?.();
    };
    
    return () => {
      // Don't remove script on unmount as it's reused
      delete (window as any).onFastSpringPopupClosed;
    };
  }, [onClose]);

  const sessionData = user?.email ? JSON.stringify({ customer_email: user.email }) : '{}';

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h3 className="text-xl font-semibold">Assinar {planName}</h3>
      <p className="text-muted-foreground text-center">
        Você será redirecionado para o checkout seguro do FastSpring
      </p>
      <button
        data-fsc-item-path-value={planPath}
        data-fsc-action="Add,Checkout"
        data-fsc-session={sessionData}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full"
      >
        Continuar para Pagamento
      </button>
    </div>
  );
};
