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
import { ArrowUp, ArrowDown, Trash2, Crown } from 'lucide-react';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import { CommunityRole } from '@/hooks/useCommunity';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MembersManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string | undefined;
}

export const MembersManagementModal = ({
  open,
  onOpenChange,
  communityId,
}: MembersManagementModalProps) => {
  const { members, updateMemberRole, removeMember, canPromoteToLeader } =
    useCommunityMembers(communityId);

  const getRoleBadge = (role: CommunityRole) => {
    const roleConfig = {
      challenger_leader: { label: 'Challenger Leader', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: Crown },
      champion: { label: 'Champion', color: 'bg-gradient-to-r from-blue-500 to-purple-500', icon: null },
      novice: { label: 'Novice', color: 'bg-muted', icon: null },
    };

    const config = roleConfig[role];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {Icon && <Icon className="w-3 h-3" />}
        {config.label}
      </Badge>
    );
  };

  const handlePromote = async (memberId: string, userId: string, currentRole: CommunityRole) => {
    if (currentRole === 'novice') {
      updateMemberRole({ memberId, newRole: 'champion', userId });
    } else if (currentRole === 'champion') {
      const canPromote = await canPromoteToLeader();
      if (canPromote) {
        updateMemberRole({ memberId, newRole: 'challenger_leader', userId });
      } else {
        toast({
          title: 'Limite atingido',
          description: 'Já existem 3 Challenger Leaders nesta comunidade.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDemote = (memberId: string, userId: string, currentRole: CommunityRole) => {
    if (currentRole === 'challenger_leader') {
      updateMemberRole({ memberId, newRole: 'champion', userId });
    } else if (currentRole === 'champion') {
      updateMemberRole({ memberId, newRole: 'novice', userId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Membros</DialogTitle>
          <DialogDescription>
            Promova, rebaixe ou remova membros da comunidade.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {!members || members.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhum membro encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <Card key={member.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold">
                          {member.profiles?.full_name || 'Usuário'}
                        </h3>
                        <div className="mt-1">{getRoleBadge(member.role)}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {member.role !== 'challenger_leader' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePromote(member.id, member.user_id, member.role)}
                        >
                          <ArrowUp className="w-4 h-4 mr-1" />
                          Promover
                        </Button>
                      )}

                      {member.role !== 'novice' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDemote(member.id, member.user_id, member.role)}
                        >
                          <ArrowDown className="w-4 h-4 mr-1" />
                          Rebaixar
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover{' '}
                              {member.profiles?.full_name || 'este usuário'} da comunidade?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeMember(member.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
