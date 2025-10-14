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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Globe, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityChallenges } from '@/hooks/useCommunityChallenges';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateCommunityChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string | undefined;
}

export const CreateCommunityChallengeModal = ({
  open,
  onOpenChange,
  communityId,
}: CreateCommunityChallengeModalProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isGlobal, setIsGlobal] = useState(false);
  const { createChallenge } = useCommunityChallenges(communityId);
  const { userRole } = useCommunityMembers(communityId);
  const { subscription } = useSubscription();

  const canCreateGlobal = subscription?.tier === 'plus_annual';
  const needsApproval = userRole === 'champion';

  const { data: templates } = useQuery({
    queryKey: ['challenge-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_templates')
        .select('*')
        .or('is_public.eq.true,is_default.eq.true')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = () => {
    if (!selectedTemplateId) return;

    createChallenge({
      templateId: selectedTemplateId,
      isGlobal,
      communityId: isGlobal ? undefined : communityId,
    });

    setSelectedTemplateId(null);
    setIsGlobal(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Desafio Comunitário</DialogTitle>
          <DialogDescription>
            Escolha um template de desafio para compartilhar com a comunidade.
          </DialogDescription>
        </DialogHeader>

        {needsApproval && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Como Champion, seus desafios precisam ser aprovados por um Challenger Leader.
            </AlertDescription>
          </Alert>
        )}

        {canCreateGlobal && (
          <div className="flex items-center space-x-2">
            <Switch
              id="global"
              checked={isGlobal}
              onCheckedChange={setIsGlobal}
            />
            <Label htmlFor="global" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Desafio Global (visível para todos os usuários Neumann)
            </Label>
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          {!templates || templates.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhum template disponível.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTemplateId === template.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="secondary">{template.duration_days} dias</Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedTemplateId}>
            Criar Desafio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
