import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { Check, Sparkles, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { StripeCheckout } from '@/components/payment/StripeCheckout';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function Subscriptions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, isLoading, getFeatures, refreshSubscription } = useSubscription();
  
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    priceId: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleRefreshProfile = async () => {
    try {
      await refreshSubscription();
      toast({
        title: 'Perfil atualizado',
        description: 'Seu status de assinatura foi atualizado.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    }
  };

  const handleSubscribe = (plan: typeof plans[0]) => {
    if (plan.tier === 'free' || subscription?.tier === plan.tier) {
      return;
    }
    
    setSelectedPlan({
      priceId: plan.priceId,
      name: plan.name,
    });
    setCheckoutModalOpen(true);
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir o portal de gerenciamento.',
        variant: 'destructive',
      });
    }
  };

  const plans = [
    {
      tier: 'free',
      name: 'Neumann Free',
      price: 'Grátis',
      priceId: '',
      features: [
        'Apenas 1 desafio ativo por dia',
        '1 objetivo por mês',
        'Limite de nível 25',
        'Sem acesso à comunidade',
      ],
    },
    {
      tier: 'plus_monthly',
      name: 'Neumann Plus Mensal',
      price: 'R$ 14,90',
      priceId: 'price_1SIBXMPzwST7RaKh5ePjbrBw',
      period: '/mês',
      features: [
        '5 desafios por dia',
        '5 objetivos por mês',
        'Nível XP ilimitado',
        'Acesso à comunidade',
        'Ajuste dos desafios padrão',
      ],
      popular: true,
    },
    {
      tier: 'plus_annual',
      name: 'Neumann Plus Anual',
      price: 'R$ 129,90',
      priceId: 'price_1SIBZVPzwST7RaKhOOEadBxR',
      period: '/ano',
      discount: '30% de desconto',
      features: [
        'Desafios ativos simultâneos ilimitados',
        'Objetivos de vida ilimitados',
        'Criação de comunidades e de novos desafios globais',
        'Todos os benefícios do Plus Mensal',
      ],
      badge: 'Melhor Valor',
    },
  ];

  const currentFeatures = getFeatures();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 font-display text-primary">Assinaturas</h1>
          <p className="text-muted-foreground font-body">Escolha o plano ideal para você</p>
          
          {currentFeatures && (
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <Badge className="text-sm py-1 px-3">
                Plano Atual: {currentFeatures.name}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshProfile}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar Perfil
              </Button>
              {subscription?.tier !== 'free' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManageSubscription}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Gerenciar Assinatura
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.tier === plan.tier;

            return (
              <Card 
                key={plan.tier}
                className={`relative flex flex-col ${
                  plan.popular 
                    ? 'border-primary border-2 shadow-lg' 
                    : ''
                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl font-display">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    {plan.discount && (
                      <span className="block mt-2">
                        <Badge variant="outline" className="text-success">
                          {plan.discount}
                        </Badge>
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm font-body">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="mt-auto">
                  <Button 
                    className="w-full"
                    variant={isCurrentPlan || plan.tier === 'free' ? 'outline' : 'default'}
                    disabled={isCurrentPlan || plan.tier === 'free'}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {plan.tier === 'free' ? 'Meu plano atual' : (isCurrentPlan ? 'Plano Atual' : 'Assinar')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Todos os planos podem ser cancelados a qualquer momento.</p>
        </div>

        <Dialog open={checkoutModalOpen} onOpenChange={(open) => {
          setCheckoutModalOpen(open);
          if (!open) setSelectedPlan(null);
        }}>
          <DialogContent>
            <DialogTitle className="sr-only">Finalizar Assinatura</DialogTitle>
            <DialogDescription className="sr-only">
              Complete o processo de assinatura do plano {selectedPlan?.name}
            </DialogDescription>
            {selectedPlan && (
              <StripeCheckout
                priceId={selectedPlan.priceId}
                planName={selectedPlan.name}
                onClose={() => setCheckoutModalOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
