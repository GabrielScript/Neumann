import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Search, Users, Lock } from 'lucide-react';
import { useCommunity } from '@/hooks/useCommunity';
import { useSubscription } from '@/hooks/useSubscription';
import { useJoinRequests } from '@/hooks/useJoinRequests';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface JoinCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinCommunityModal = ({ open, onOpenChange }: JoinCommunityModalProps) => {
  const [search, setSearch] = useState('');
  const { allCommunities, userCommunities, joinCommunity } = useCommunity();
  const { checkCommunityMemberLimit } = useSubscription();
  const { createRequest } = useJoinRequests("");

  const availableCommunities = allCommunities?.filter(
    (community) =>
      !userCommunities?.some((uc) => uc && uc.id === community.id) &&
      community.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = async (communityId: string, isPublic: boolean) => {
    try {
      const canJoin = await checkCommunityMemberLimit();
      if (!canJoin) {
        toast.error('Você atingiu o limite de comunidades do seu plano.');
        return;
      }
      
      if (isPublic) {
        joinCommunity(communityId);
      } else {
        createRequest(communityId);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao processar solicitação.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Explorar Comunidades</DialogTitle>
          <DialogDescription>
            Encontre e participe de comunidades que combinam com você.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comunidades..."
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {!availableCommunities || availableCommunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? 'Nenhuma comunidade encontrada.' : 'Nenhuma comunidade disponível.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableCommunities.map((community) => (
                <Card key={community.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{community.name}</h3>
                        {!community.is_public && (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="w-3 h-3" />
                            Privada
                          </Badge>
                        )}
                      </div>
                      {community.description && (
                        <p className="text-sm text-muted-foreground">
                          {community.description}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleJoin(community.id, community.is_public)}
                      size="sm"
                      className="ml-4"
                    >
                      {community.is_public ? "Entrar" : "Solicitar"}
                    </Button>
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
