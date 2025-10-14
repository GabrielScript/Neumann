import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Users } from 'lucide-react';
import { Community } from '@/hooks/useCommunity';
import { useSubscription } from '@/hooks/useSubscription';

interface CommunityListProps {
  communities: Community[];
  selectedCommunityId: string | undefined;
  onSelectCommunity: (id: string) => void;
  onCreateCommunity: () => void;
  onJoinCommunity: () => void;
}

export const CommunityList = ({
  communities,
  selectedCommunityId,
  onSelectCommunity,
  onCreateCommunity,
  onJoinCommunity,
}: CommunityListProps) => {
  const { subscription } = useSubscription();
  const canCreate = subscription?.tier === 'plus_annual';

  return (
    <Card className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Minhas Comunidades</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {communities.map((community) => (
            <button
              key={community.id}
              onClick={() => onSelectCommunity(community.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedCommunityId === community.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <div className="font-medium truncate">{community.name}</div>
              {community.description && (
                <div className="text-xs opacity-80 truncate mt-1">
                  {community.description}
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-4 space-y-2">
        {canCreate && (
          <Button onClick={onCreateCommunity} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Criar Comunidade
          </Button>
        )}
        <Button onClick={onJoinCommunity} variant="outline" className="w-full" size="sm">
          <Users className="w-4 h-4 mr-2" />
          Explorar
        </Button>
      </div>
    </Card>
  );
};
