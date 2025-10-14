import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCommunity } from '@/hooks/useCommunity';
import { useSubscription } from '@/hooks/useSubscription';

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCommunityModal = ({ open, onOpenChange }: CreateCommunityModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createCommunity } = useCommunity();
  const { subscription } = useSubscription();

  const canCreate = subscription?.tier === 'plus_annual';

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    createCommunity({ name, description });
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Comunidade</DialogTitle>
          <DialogDescription>
            {canCreate
              ? 'Crie uma comunidade para compartilhar desafios e conectar-se com outros usuários.'
              : 'Apenas usuários Neumann Plus Anual podem criar comunidades.'}
          </DialogDescription>
        </DialogHeader>

        {canCreate ? (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Comunidade</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Desafio 30 Dias"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o propósito da comunidade..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!name.trim()}>
                Criar Comunidade
              </Button>
            </DialogFooter>
          </>
        ) : (
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Entendi</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
