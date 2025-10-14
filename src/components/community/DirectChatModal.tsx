import { useState, useEffect, useRef } from 'react';
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
import { Send } from 'lucide-react';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DirectChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string | undefined;
  otherUserId: string;
  otherUserName: string;
}

export const DirectChatModal = ({
  open,
  onOpenChange,
  communityId,
  otherUserId,
  otherUserName,
}: DirectChatModalProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, markAsRead, isLoading } = useDirectMessages(communityId, otherUserId);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (messages && user) {
      messages.forEach((msg) => {
        if (msg.receiver_id === user.id && !msg.read) {
          markAsRead(msg.id);
        }
      });
    }
  }, [messages, user, markAsRead]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat com {otherUserName}</DialogTitle>
          <DialogDescription>
            Mensagens privadas dentro da comunidade
          </DialogDescription>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhuma mensagem ainda. Comece a conversa!</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
