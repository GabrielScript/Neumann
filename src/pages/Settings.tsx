import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getPlanDisplayName = () => {
    if (!subscription?.tier) return 'Free';
    switch (subscription.tier) {
      case 'free':
        return 'Neumann Free';
      case 'plus_monthly':
        return 'Neumann Plus Mensal';
      case 'plus_annual':
        return 'Neumann Plus Anual';
      default:
        return 'Free';
    }
  };

  const getTierBadgeColor = () => {
    switch (subscription?.tier) {
      case 'free':
        return 'bg-muted text-muted-foreground';
      case 'plus_monthly':
        return 'bg-primary text-primary-foreground';
      case 'plus_annual':
        return 'bg-gradient-to-r from-primary to-accent text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-4xl font-display font-bold text-primary mb-8">Configurações</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Seus dados de perfil e assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-lg font-medium">{user?.email}</p>
            </div>
            
            <div>
              <Label className="text-muted-foreground">Tipo de Assinatura</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getTierBadgeColor()}>
                  {getPlanDisplayName()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Escolha o tema da aplicação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex items-center gap-2"
              >
                <Sun className="h-5 w-5" />
                Claro
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex items-center gap-2"
              >
                <Moon className="h-5 w-5" />
                Escuro
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Gerenciar sua conta e sessão</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </Layout>
  );
}
