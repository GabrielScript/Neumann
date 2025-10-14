import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useCommunityChallenges } from '@/hooks/useCommunityChallenges';

interface ApproveChallengesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string | undefined;
}

export const ApproveChallengesModal = ({
  open,
  onOpenChange,
  communityId,
}: ApproveChallengesModalProps) => {
  const { pendingChallenges, approveChallenge, rejectChallenge } =
    useCommunityChallenges(communityId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aprovar Desafios</DialogTitle>
          <DialogDescription>
            Revise e aprove os desafios criados por Champions.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {!pendingChallenges || pendingChallenges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Clock className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum desafio aguardando aprovação.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingChallenges.map((challenge) => (
                <Card key={challenge.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {challenge.challenge_templates?.name}
                        </h3>
                        {challenge.challenge_templates?.description && (
                          <p className="text-sm text-muted-foreground">
                            {challenge.challenge_templates.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Criado por: {challenge.profiles?.full_name || 'Usuário'}
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectChallenge(challenge.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveChallenge(challenge.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
