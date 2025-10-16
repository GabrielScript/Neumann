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
import { communitySchema } from '@/lib/validation';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCommunityModal = ({ open, onOpenChange }: CreateCommunityModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createCommunityAsync } = useCommunity();
  const { subscription, checkCommunityLeaderLimit } = useSubscription();

  const canCreate = subscription?.tier === 'plus_annual';

  const handleSubmit = async () => {
    // Validate community data
    try {
      communitySchema.parse({
        name,
        description: description || undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    // Check leader limit
    try {
      const canLead = await checkCommunityLeaderLimit();
      if (!canLead) {
        toast.error('Você atingiu o limite de 5 comunidades lideradas.');
        return;
      }
    } catch (error) {
      toast.error('Erro ao verificar limite de liderança.');
      return;
    }
    
    // Create community and award XP
    try {
      const newCommunity = await createCommunityAsync({ name, description });
      
      // Award XP for community creation
      const { data: xpData, error: xpError } = await supabase.functions.invoke('award-community-creation-xp', {
        body: {
          community_id: newCommunity.id,
        },
      });

      if (!xpError && xpData?.xpAwarded) {
        toast.success(`Comunidade criada! +${xpData.xpAwarded} XP`);
      }

      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao criar comunidade.');
    }
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
