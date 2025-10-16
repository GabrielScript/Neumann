import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useChallengeProgress } from "@/hooks/useChallengeProgress";
import { useChallengeStats } from "@/hooks/useChallengeStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, CheckCircle, Calendar, Save, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
import { EditActiveChallengeModal } from "./EditActiveChallengeModal"; // Importar o novo modal
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ActiveChallengeTabProps {
  challenge: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    difficulty?: number | null; // Adicionado difficulty
    alignment_score?: number | null; // Adicionado alignment_score
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

const difficultyLabels: { [key: number]: string } = {
  1: "Muito Fácil",
  2: "Fácil",
  3: "Médio",
  4: "Difícil",
  5: "Muito Difícil",
};

export function ActiveChallengeTab({ challenge }: ActiveChallengeTabProps) {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const { items, progress, isLoading, toggleItem, completedToday, totalItems, progressPercentage } =
    useChallengeProgress(challenge.id, today);
  const { stats, isLoading: statsLoading } = useChallengeStats(challenge.id);
  
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false); // Estado para o modal de edição
  const [detailsModalOpen, setDetailsModalOpen] = useState(false); // Estado para o modal de detalhes
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isItemCompleted = (itemId: string) => {
    return progress?.some((p) => p.item_id === itemId && p.completed) || false;
  };

  const handleSaveAsTemplate = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    
    try {
      // Create template from active challenge
      const { data: template, error: templateError } = await supabase
        .from("challenge_templates")
        .insert({
          name: challenge.name,
          description: `Template criado a partir do desafio ativo`,
          duration_days: challenge.duration_days,
          created_by: user.id,
          is_public: false,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Copy all items to the template
      if (items && items.length > 0) {
        const templateItems = items.map((item, index) => ({
          template_id: template.id,
          title: item.title,
          description: item.description,
          priority: item.priority,
          facilitators: item.facilitators,
          reminder_time: item.reminder_time,
          happiness_level: item.happiness_level,
          position: index,
        }));

        const { error: itemsError } = await supabase
          .from("challenge_items")
          .insert(templateItems);

        if (itemsError) throw itemsError;
      }

      queryClient.invalidateQueries({ queryKey: ["challenge-templates"] });
      
      toast({
        title: "✅ Desafio salvo!",
        description: "O desafio foi salvo na sua biblioteca com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o desafio.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  if (isLoading || statsLoading) {
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
              <div className="flex items-center gap-2 mt-2">
                {challenge.difficulty && (
                  <Badge variant="outline">
                    Dificuldade: {difficultyLabels[challenge.difficulty]}
                  </Badge>
                )}
                {challenge.alignment_score && (
                  <Badge variant="outline">
                    Alinhamento: {challenge.alignment_score}/10
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Dias Restantes: {stats?.remainingDays || 0}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDetailsModalOpen(true)}
              >
                Ver Detalhes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditModalOpen(true)} // Botão para abrir o modal de edição
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSaveAsTemplate}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setAbandonDialogOpen(true)}>
                Abandonar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Progresso Total</span>
                <span className="font-semibold text-primary">
                  {stats?.completedDays || 0}/{stats?.totalDays || 0} dias
                </span>
              </div>
              <Progress value={stats?.progressPercentage || 0} className="h-3" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso de Hoje</span>
                <span className="font-semibold">
                  {completedToday}/{totalItems} itens
                </span>
              </div>
              <Progress value={progressPercentage} />
            </div>
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
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

      {/* Modal de Edição do Desafio Ativo */}
      <EditActiveChallengeModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        challengeId={challenge.id}
      />

      {/* Modal de Detalhes do Desafio */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{challenge.name}</DialogTitle>
            <DialogDescription>
              {new Date(challenge.start_date).toLocaleDateString()} até{" "}
              {new Date(challenge.end_date).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações do Desafio */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Informações do Desafio</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-medium">{challenge.duration_days} dias</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dias Completados</p>
                  <p className="font-medium">{stats?.completedDays || 0} dias</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dias Restantes</p>
                  <p className="font-medium">{stats?.remainingDays || 0} dias</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="font-medium">{Math.round(stats?.progressPercentage || 0)}%</p>
                </div>
                {challenge.difficulty && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dificuldade</p>
                    <p className="font-medium">{difficultyLabels[challenge.difficulty]}</p>
                  </div>
                )}
                {challenge.alignment_score && (
                  <div>
                    <p className="text-sm text-muted-foreground">Alinhamento</p>
                    <p className="font-medium">{challenge.alignment_score}/10</p>
                  </div>
                )}
              </div>
            </div>

            {/* Hábitos do Desafio */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Hábitos do Desafio ({items?.length || 0})</h3>
              <div className="space-y-3">
                {items && items.length > 0 ? (
                  items.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium">
                          {index + 1}. {item.title}
                        </h4>
                        <Badge variant={priorityColors[item.priority as keyof typeof priorityColors]}>
                          {priorityLabels[item.priority as keyof typeof priorityLabels]}
                        </Badge>
                      </div>
                      {item.description && (
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Descrição:</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      )}
                      {item.facilitators && (
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Facilitadores:</p>
                          <p className="text-sm text-muted-foreground">{item.facilitators}</p>
                        </div>
                      )}
                      {item.reminder_time && (
                        <p className="text-xs text-muted-foreground">
                          🕐 Lembrete: {item.reminder_time}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum hábito cadastrado ainda.
                  </p>
                )}
              </div>
            </div>

            <Button 
              onClick={() => {
                setDetailsModalOpen(false);
                setEditModalOpen(true);
              }} 
              className="w-full"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar Desafio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
