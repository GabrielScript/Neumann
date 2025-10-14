import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'challenge' | 'goal' | 'level' | 'community';
}

export const UpgradePrompt = ({ open, onOpenChange, limitType }: UpgradePromptProps) => {
  const navigate = useNavigate();

  const getContent = () => {
    switch (limitType) {
      case 'challenge':
        return {
          title: 'Limite de Desafios Atingido',
          description: 'Você atingiu o limite de 1 desafio diário do plano Free. Faça upgrade para o Neumann Plus e crie até 6 desafios por dia!',
        };
      case 'goal':
        return {
          title: 'Limite de Objetivos Atingido',
          description: 'Você atingiu o limite de 1 objetivo mensal do plano Free. Faça upgrade para o Neumann Plus e crie objetivos ilimitados!',
        };
      case 'level':
        return {
          title: 'Nível Máximo Atingido',
          description: 'Você atingiu o nível 25, o máximo do plano Free. Faça upgrade para o Neumann Plus e continue evoluindo sem limites!',
        };
      case 'community':
        return {
          title: 'Comunidades - Recurso Premium',
          description: 'Comunidades são um recurso exclusivo para usuários Neumann Plus. Faça upgrade para participar de comunidades e compartilhar desafios!',
        };
      default:
        return {
          title: 'Limite Atingido',
          description: 'Você atingiu um limite do plano Free. Faça upgrade para desbloquear mais recursos!',
        };
    }
  };

  const content = getContent();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content.title}</AlertDialogTitle>
          <AlertDialogDescription>{content.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => navigate('/subscriptions')}>
            Ver Planos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
