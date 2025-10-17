import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GratitudeDiaryEntry } from "@/hooks/useGratitudeDiary";
import { Sparkles } from "lucide-react";

interface GratitudeDiaryHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: GratitudeDiaryEntry[];
  challengeName: string;
}

export function GratitudeDiaryHistoryModal({
  open,
  onOpenChange,
  history,
  challengeName,
}: GratitudeDiaryHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Histórico - {challengeName}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {history.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Dia {entry.day_number} - {format(new Date(entry.date), "dd/MM/yyyy", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entry.gratitude_1 && (
                    <div>
                      <p className="text-sm font-semibold text-primary mb-1">Gratidão 1:</p>
                      <p className="text-sm">{entry.gratitude_1}</p>
                    </div>
                  )}

                  {entry.gratitude_2 && (
                    <div>
                      <p className="text-sm font-semibold text-primary mb-1">Gratidão 2:</p>
                      <p className="text-sm">{entry.gratitude_2}</p>
                    </div>
                  )}

                  {entry.gratitude_3 && (
                    <div>
                      <p className="text-sm font-semibold text-primary mb-1">Gratidão 3:</p>
                      <p className="text-sm">{entry.gratitude_3}</p>
                    </div>
                  )}

                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Registrado em {format(new Date(entry.created_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
