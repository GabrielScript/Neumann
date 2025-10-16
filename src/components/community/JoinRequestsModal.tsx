import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJoinRequests } from "@/hooks/useJoinRequests";
import { Check, X, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface JoinRequestsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
}

export const JoinRequestsModal = ({ open, onOpenChange, communityId }: JoinRequestsModalProps) => {
  const { requests, isLoading, reviewRequest } = useJoinRequests(communityId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Solicitações de Entrada
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação pendente.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold">
                          {request.profiles?.full_name || 'Usuário'}
                        </h3>
                        <Badge variant="secondary">Pendente</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Solicitado em {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => reviewRequest({ requestId: request.id, approved: true })}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => reviewRequest({ requestId: request.id, approved: false })}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Recusar
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
