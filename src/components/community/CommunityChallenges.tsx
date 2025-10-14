import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Globe } from 'lucide-react';
import { useCommunityChallenges } from '@/hooks/useCommunityChallenges';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import { CreateCommunityChallengeModal } from './CreateCommunityChallengeModal';

interface CommunityChallengesProps {
  communityId: string | undefined;
}

export const CommunityChallenges = ({ communityId }: CommunityChallengesProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { challenges, isLoading } = useCommunityChallenges(communityId);
  const { userRole } = useCommunityMembers(communityId);

  const canCreateChallenge = userRole === 'champion' || userRole === 'challenger_leader';

  const approvedChallenges = challenges?.filter((c) => c.status === 'approved') || [];

  return (
    <>
      <Card className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Desafios da Comunidade</h2>
          {canCreateChallenge && (
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Criar Desafio
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : approvedChallenges.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <p className="text-muted-foreground">Nenhum desafio aprovado ainda.</p>
              {canCreateChallenge && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Criar o Primeiro Desafio
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedChallenges.map((challenge) => (
                <Card key={challenge.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">
                      {challenge.challenge_templates?.name}
                    </h3>
                    {challenge.is_global && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Global
                      </Badge>
                    )}
                  </div>
                  {challenge.challenge_templates?.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {challenge.challenge_templates.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Criado por: {challenge.profiles?.full_name || 'Usuário'}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      <CreateCommunityChallengeModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        communityId={communityId}
      />
    </>
  );
};
