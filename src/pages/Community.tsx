import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useCommunity } from '@/hooks/useCommunity';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { CommunityList } from '@/components/community/CommunityList';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { CommunityChallenges } from '@/components/community/CommunityChallenges';
import { CommunityChat } from '@/components/community/CommunityChat';
import { CreateCommunityModal } from '@/components/community/CreateCommunityModal';
import { JoinCommunityModal } from '@/components/community/JoinCommunityModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus } from 'lucide-react';

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canAccessCommunity } = useSubscription();
  const { userCommunities, isLoading } = useCommunity();
  const [selectedCommunity, setSelectedCommunity] = useState<string | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (userCommunities && userCommunities.length > 0 && !selectedCommunity && userCommunities[0]?.id) {
      setSelectedCommunity(userCommunities[0].id);
    }
  }, [userCommunities, selectedCommunity]);

  if (!canAccessCommunity()) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <Users className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Comunidades</h2>
            <p className="text-muted-foreground max-w-md">
              Participe de comunidades, compartilhe desafios e conecte-se com outros usuários Neumann.
            </p>
            <Button onClick={() => setShowUpgradePrompt(true)} className="mt-4">
              Fazer Upgrade para Acessar
            </Button>
          </div>
        </div>
        <UpgradePrompt
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
          limitType="community"
        />
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!userCommunities || userCommunities.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <Users className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Nenhuma comunidade ainda</h2>
            <p className="text-muted-foreground max-w-md">
              Crie uma nova comunidade ou entre em uma existente para começar.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Comunidade
              </Button>
              <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                <Users className="w-4 h-4 mr-2" />
                Explorar Comunidades
              </Button>
            </div>
          </div>
        </div>
        <CreateCommunityModal open={showCreateModal} onOpenChange={setShowCreateModal} />
        <JoinCommunityModal open={showJoinModal} onOpenChange={setShowJoinModal} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-center">
        <Badge variant="outline" className="text-sm py-1 px-4 border-yellow-500 text-yellow-600 dark:text-yellow-400">
          🚧 Em Desenvolvimento - Versão Beta
        </Badge>
      </div>
      {selectedCommunity ? (
        <div className="flex gap-4 h-[calc(100vh-10rem)]">
          {/* Sidebar esquerda - Lista de comunidades */}
          <div className="w-64 flex-shrink-0">
            <CommunityList
              communities={userCommunities}
              selectedCommunityId={selectedCommunity}
              onSelectCommunity={setSelectedCommunity}
              onCreateCommunity={() => setShowCreateModal(true)}
              onJoinCommunity={() => setShowJoinModal(true)}
            />
          </div>

          {/* Centro - Header e Desafios */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <CommunityHeader communityId={selectedCommunity} />
            <CommunityChallenges communityId={selectedCommunity} />
          </div>

          {/* Sidebar direita - Chat */}
          <div className="w-80 flex-shrink-0">
            <CommunityChat communityId={selectedCommunity} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      <CreateCommunityModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      <JoinCommunityModal open={showJoinModal} onOpenChange={setShowJoinModal} />
    </Layout>
  );
};

export default Community;
