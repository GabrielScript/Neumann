import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useChallengeProgress } from "@/hooks/useChallengeProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ActiveChallengeTabProps {
  challenge: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    duration_days: number;
  };
}

const priorityColors = {
  imprescindivel: "destructive",
  importante: "default",
  acessorio: "secondary",
} as const;

const priorityLabels = {
  imprescindivel: "Imprescindível",
  importante: "Importante",
  acessorio: "Acessório",
};

export function ActiveChallengeTab({ challenge }: ActiveChallengeTabProps) {
  const today = new Date().toISOString().split("T")[0];
  const { items, progress, isLoading, toggleItem, completedToday, totalItems, progressPercentage } =
    useChallengeProgress(challenge.id, today);
  
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isItemCompleted = (itemId: string) => {
    return progress?.some((p) => p.item_id === itemId && p.completed) || false;
  };

  const handleAbandonChallenge = async () => {
    const { error } = await supabase
      .from("challenges")
      .update({ is_active: false })
      .eq("id", challenge.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível abandonar o desafio.",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["active-challenges"] });
    toast({
      title: "Desafio abandonado",
      description: "Você pode iniciar um novo desafio quando quiser.",
    });
    setAbandonDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{challenge.name}</CardTitle>
              <CardDescription>
                {new Date(challenge.start_date).toLocaleDateString()} até{" "}
                {new Date(challenge.end_date).toLocaleDateString()}
              </CardDescription>
            </div>
            <Button variant="destructive" onClick={() => setAbandonDialogOpen(true)}>
              Abandonar Desafio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso de Hoje</span>
              <span className="font-semibold">
                {completedToday}/{totalItems} itens
              </span>
            </div>
            <Progress value={progressPercentage} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Checklist Diário</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items && items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={isItemCompleted(item.id)}
                    onCheckedChange={(checked) =>
                      toggleItem({ itemId: item.id, completed: !!checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge variant={priorityColors[item.priority as keyof typeof priorityColors]}>
                        {priorityLabels[item.priority as keyof typeof priorityLabels]}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    {item.reminder_time && (
                      <p className="text-xs text-muted-foreground">
                        🕐 Lembrete: {item.reminder_time}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum item no checklist ainda.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={abandonDialogOpen} onOpenChange={setAbandonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandonar Desafio?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja abandonar este desafio? Seu progresso será mantido, mas o
              desafio não estará mais ativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAbandonChallenge} className="bg-destructive">
              Abandonar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
