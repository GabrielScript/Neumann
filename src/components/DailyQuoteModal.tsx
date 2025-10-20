import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DailyQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: { quote: string } | null;
  loading?: boolean;
}

export const DailyQuoteModal = ({ open, onOpenChange, quote, loading }: DailyQuoteModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-2 border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-display">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Quote className="w-6 h-6 text-primary" />
            </div>
            Frase do Dia
          </DialogTitle>
        </DialogHeader>

        <div className="py-8 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : quote ? (
            <div className="relative">
              {/* Aspas decorativas */}
              <Quote className="absolute -top-4 -left-2 w-12 h-12 text-primary/20" />
              
              <blockquote className="text-lg md:text-xl text-foreground/90 font-body leading-relaxed text-center italic px-8 py-4">
                "{quote.quote}"
              </blockquote>

              <Quote className="absolute -bottom-4 -right-2 w-12 h-12 text-primary/20 rotate-180" />
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Nenhuma frase disponível no momento.
            </p>
          )}
        </div>

        <div className="flex justify-center mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
