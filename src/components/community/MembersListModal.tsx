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
import { MessageCircle, Users } from 'lucide-react';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import { CommunityRole } from '@/hooks/useCommunity';
import { useState } from 'react';
import { DirectChatModal } from './DirectChatModal';
import { useAuth } from '@/contexts/AuthContext';

interface MembersListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string | undefined;
}

export const MembersListModal = ({
  open,
  onOpenChange,
  communityId,
}: MembersListModalProps) => {
  const { members } = useCommunityMembers(communityId);
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);

  const getRoleBadge = (role: CommunityRole) => {
    const roleConfig = {
      challenger_leader: { label: 'Challenger Leader', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
      champion: { label: 'Champion', color: 'bg-gradient-to-r from-blue-500 to-purple-500' },
      novice: { label: 'Novice', color: 'bg-muted' },
    };

    const config = roleConfig[role];
    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const handleStartChat = (memberId: string, memberName: string) => {
    setSelectedMember({ id: memberId, name: memberName });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membros da Comunidade
            </DialogTitle>
            <DialogDescription>
              Veja todos os membros e inicie conversas privadas.
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
                  <Card key={member.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {member.profiles?.full_name || 'Usuário'}
                            </h3>
                            {member.user_id === user?.id && (
                              <Badge variant="outline" className="text-xs">Você</Badge>
                            )}
                          </div>
                          <div className="mt-1">{getRoleBadge(member.role)}</div>
                        </div>
                      </div>

                      {member.user_id !== user?.id && (
                        <Button
                          size="sm"
                          onClick={() => handleStartChat(member.user_id, member.profiles?.full_name || 'Usuário')}
                          className="ml-3"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat Privado
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedMember && (
        <DirectChatModal
          open={!!selectedMember}
          onOpenChange={(open) => !open && setSelectedMember(null)}
          communityId={communityId}
          otherUserId={selectedMember.id}
          otherUserName={selectedMember.name}
        />
      )}
    </>
  );
};
