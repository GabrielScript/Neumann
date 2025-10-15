import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EditCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDescription: string | null;
  onSave: (description: string) => void;
}

export const EditCommunityModal = ({
  open,
  onOpenChange,
  currentDescription,
  onSave,
}: EditCommunityModalProps) => {
  const [description, setDescription] = useState(currentDescription || '');

  useEffect(() => {
    setDescription(currentDescription || '');
  }, [currentDescription]);

  const handleSave = () => {
    onSave(description);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Descrição da Comunidade</DialogTitle>
          <DialogDescription>
            Atualize a descrição para informar os membros sobre a comunidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito e objetivos da comunidade..."
              className="min-h-[200px]"
              maxLength={1000}
            />
            <p className="text-sm text-muted-foreground text-right">
              {description.length}/1000 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
