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
import { Search, Users } from 'lucide-react';
import { useCommunity } from '@/hooks/useCommunity';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface JoinCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinCommunityModal = ({ open, onOpenChange }: JoinCommunityModalProps) => {
  const [search, setSearch] = useState('');
  const { allCommunities, userCommunities, joinCommunity } = useCommunity();
  const { checkCommunityMemberLimit } = useSubscription();

  const availableCommunities = allCommunities?.filter(
    (community) =>
      !userCommunities?.some((uc) => uc && uc.id === community.id) &&
      community.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = async (communityId: string) => {
    try {
      const canJoin = await checkCommunityMemberLimit();
      if (!canJoin) {
        toast.error('Você atingiu o limite de comunidades do seu plano');
        return;
      }
      joinCommunity(communityId);
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao verificar limite de comunidades');
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{community.name}</h3>
                      {community.description && (
                        <p className="text-sm text-muted-foreground">
                          {community.description}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleJoin(community.id)}
                      size="sm"
                      className="ml-4"
                    >
                      Entrar
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
