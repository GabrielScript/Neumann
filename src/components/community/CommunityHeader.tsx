import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, CheckCircle, UserPlus, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Community } from '@/hooks/useCommunity';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import { MembersManagementModal } from './MembersManagementModal';
import { ApproveChallengesModal } from './ApproveChallengesModal';
import { MembersListModal } from './MembersListModal';

interface CommunityHeaderProps {
  communityId: string | undefined;
}

export const CommunityHeader = ({ communityId }: CommunityHeaderProps) => {
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [showMembersListModal, setShowMembersListModal] = useState(false);
  const { userRole } = useCommunityMembers(communityId);

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();

      if (error) throw error;
      return data as Community;
    },
    enabled: !!communityId,
  });

  const getRoleBadge = () => {
    if (!userRole) return null;

    const roleConfig = {
      challenger_leader: { label: 'Challenger Leader', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
      champion: { label: 'Champion', color: 'bg-gradient-to-r from-blue-500 to-purple-500' },
      novice: { label: 'Novice', color: 'bg-muted' },
    };

    const config = roleConfig[userRole];
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  if (!community) return null;

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{community.name}</h1>
              {getRoleBadge()}
            </div>
            {community.description && (
              <p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
                {community.description}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMembersListModal(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Ver Membros
            </Button>
            
            {userRole === 'challenger_leader' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApprovalsModal(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar Desafios
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMembersModal(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Gerenciar Membros
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <MembersManagementModal
        open={showMembersModal}
        onOpenChange={setShowMembersModal}
        communityId={communityId}
      />

      <MembersListModal
        open={showMembersListModal}
        onOpenChange={setShowMembersListModal}
        communityId={communityId}
      />

      <ApproveChallengesModal
        open={showApprovalsModal}
        onOpenChange={setShowApprovalsModal}
        communityId={communityId}
      />
    </>
  );
};
