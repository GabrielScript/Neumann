import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { useCommunityChat } from '@/hooks/useCommunityChat';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { chatMessageSchema } from '@/lib/validation';
import { z } from 'zod';
import { toast } from 'sonner';

interface CommunityChatProps {
  communityId: string | undefined;
}

export const CommunityChat = ({ communityId }: CommunityChatProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const { messages, isLoading, sendMessage } = useCommunityChat(communityId);
  const { members } = useCommunityMembers(communityId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    // Validate message
    try {
      chatMessageSchema.parse({ message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    
    sendMessage(message);
    setMessage('');
  };

  const getMemberRole = (userId: string) => {
    const member = members?.find((m) => m.user_id === userId);
    return member?.role || 'novice';
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      challenger_leader: { label: 'Leader', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
      champion: { label: 'Champion', color: 'bg-gradient-to-r from-blue-500 to-purple-500' },
      novice: { label: 'Novice', color: 'bg-muted' },
    };

    const config = roleConfig[role as keyof typeof roleConfig];
    return (
      <Badge className={`${config.color} text-white text-[10px] px-1 py-0`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="h-full flex flex-col p-4">
      <h2 className="text-lg font-bold mb-4">Chat da Comunidade</h2>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages?.map((msg) => {
                const role = getMemberRole(msg.user_id);
                const isOwn = msg.user_id === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {msg.profiles?.full_name || 'Usuário'}
                      </span>
                      {getRoleBadge(role)}
                    </div>
                    <div
                      className={`max-w-[85%] p-3 rounded-lg ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                      <span className="text-[10px] opacity-70 mt-1 block">
                        {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="mt-4 flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              maxLength={1000}
            />
            <Button onClick={handleSend} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};
