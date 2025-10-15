import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, CheckCircle, UserPlus, Users, Trash2, Edit, LogOut, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Community, useCommunity } from '@/hooks/useCommunity';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import { MembersManagementModal } from './MembersManagementModal';
import { ApproveChallengesModal } from './ApproveChallengesModal';
import { MembersListModal } from './MembersListModal';
import { EditCommunityModal } from './EditCommunityModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface CommunityHeaderProps {
  communityId: string | undefined;
}

export const CommunityHeader = ({ communityId }: CommunityHeaderProps) => {
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [showMembersListModal, setShowMembersListModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const { userRole } = useCommunityMembers(communityId);
  const { deleteCommunity, updateCommunity, leaveCommunity } = useCommunity();
  const navigate = useNavigate();

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
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDescriptionModal(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Descrição
                </Button>
              </div>
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
            
            {userRole !== 'challenger_leader' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeaveDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair da Comunidade
              </Button>
            )}
            
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Comunidade
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

      <EditCommunityModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        currentDescription={community.description}
        onSave={(description) => {
          if (communityId) {
            updateCommunity({ communityId, description });
          }
        }}
      />

      <Dialog open={showDescriptionModal} onOpenChange={setShowDescriptionModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Descrição da Comunidade</DialogTitle>
            <DialogDescription>
              {community.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {community.description}
            </p>
          </div>
          {(userRole === 'challenger_leader' || userRole === 'champion') && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDescriptionModal(false);
                  setShowEditModal(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Descrição
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Comunidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta comunidade? Esta ação não pode ser desfeita.
              Todos os membros, desafios e mensagens serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (communityId) {
                  deleteCommunity(communityId);
                  navigate('/community');
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da Comunidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair desta comunidade? Você perderá acesso aos desafios e conversas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (communityId) {
                  leaveCommunity(communityId);
                  navigate('/community');
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
