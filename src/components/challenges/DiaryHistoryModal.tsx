import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDiaryEntry } from "@/hooks/useDiaryEntry";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DiaryHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeId: string;
}

export function DiaryHistoryModal({ open, onOpenChange, challengeId }: DiaryHistoryModalProps) {
  const { history, isLoading } = useDiaryEntry(challengeId, new Date().toISOString());

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Histórico do Diário de Bordo</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">Carregando histórico...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Histórico do Diário de Bordo</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma entrada encontrada ainda. Comece preenchendo seu diário!
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Histórico do Diário de Bordo</DialogTitle>
          <DialogDescription>
            {history.length} {history.length === 1 ? "entrada registrada" : "entradas registradas"}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {history.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Dia {entry.day_number}/40
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(entry.date), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Completo</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entry.reason_to_live && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Por que valeu a pena viver este dia?</h4>
                      <p className="text-sm text-muted-foreground">{entry.reason_to_live}</p>
                    </div>
                  )}

                  {entry.world_contribution && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Contribuição para um mundo melhor</h4>
                      <p className="text-sm text-muted-foreground">{entry.world_contribution}</p>
                    </div>
                  )}

                  {(entry.action_1 || entry.action_2 || entry.action_3) && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Ações planejadas</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {entry.action_1 && <li>{entry.action_1}</li>}
                        {entry.action_2 && <li>{entry.action_2}</li>}
                        {entry.action_3 && <li>{entry.action_3}</li>}
                        {entry.action_4 && <li>{entry.action_4}</li>}
                        {entry.action_5 && <li>{entry.action_5}</li>}
                        {entry.action_6 && <li>{entry.action_6}</li>}
                      </ul>
                      {entry.actions_belief_score !== null && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Crença nas ações: <strong>{entry.actions_belief_score}/10</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {(entry.gratitude_1 || entry.gratitude_2 || entry.gratitude_3) && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Gratidões</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {entry.gratitude_1 && <li>{entry.gratitude_1}</li>}
                        {entry.gratitude_2 && <li>{entry.gratitude_2}</li>}
                        {entry.gratitude_3 && <li>{entry.gratitude_3}</li>}
                      </ul>
                    </div>
                  )}

                  {entry.learnings && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Aprendizados</h4>
                      <p className="text-sm text-muted-foreground">{entry.learnings}</p>
                    </div>
                  )}

                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Registrado em {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
