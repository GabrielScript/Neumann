import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { challengeSchema, challengeItemSchema } from "@/lib/validation";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types"; // Importar tipos do Supabase

// Definir tipos para os itens do desafio e o desafio com itens
type ChallengeItem = Tables<'challenge_items'>;
type Challenge = Tables<'challenges'>;

interface ChallengeWithItems extends Challenge {
  challenge_items: ChallengeItem[];
}

interface Habit {
  id: string;
  title: string;
  description: string;
  priority: string;
  facilitators: string;
  position: number;
}

interface EditActiveChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeId: string;
}

export function EditActiveChallengeModal({
  open,
  onOpenChange,
  challengeId,
}: EditActiveChallengeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [alignmentScore, setAlignmentScore] = useState(5);
  const [difficulty, setDifficulty] = useState("3");
  const [duration, setDuration] = useState("21");
  const [customDuration, setCustomDuration] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: challengeData, isLoading: challengeLoading } = useQuery<ChallengeWithItems>({
    queryKey: ["challenge-to-edit", challengeId],
    queryFn: async () => {
      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .select("*, challenge_items(*)")
        .eq("id", challengeId)
        .single();

      if (challengeError) throw challengeError;
      return challenge as ChallengeWithItems; // Cast para o tipo definido
    },
    enabled: open && !!challengeId,
  });

  useEffect(() => {
    if (challengeData) {
      setName(challengeData.name);
      setAlignmentScore(challengeData.alignment_score || 5);
      setDifficulty(String(challengeData.difficulty || 3));
      setDuration(String(challengeData.duration_days));
      setCustomDuration(String(challengeData.duration_days));
      setHabits(
        challengeData.challenge_items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description || "",
          priority: item.priority,
          facilitators: item.facilitators || "",
          position: item.position,
        }))
      );
    }
  }, [challengeData]);

  const addHabit = () => {
    setHabits([
      ...habits,
      {
        id: crypto.randomUUID(), // New habits get a temporary ID
        title: "",
        description: "",
        priority: "imprescindivel", // Default priority
        facilitators: "",
        position: habits.length,
      },
    ]);
  };

  const removeHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
  };

  const updateHabit = (id: string, field: keyof Habit, value: string) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const getEmoji = (level: number) => {
    if (level <= 3) return "😐";
    if (level <= 6) return "😊";
    return "🤩";
  };

  const handleSave = async () => {
    if (!user?.id || !challengeId) return;

    const durationDays =
      duration === "custom" ? parseInt(customDuration) || 0 : parseInt(duration);

    // Validate only required fields
    if (!name || name.trim().length === 0) {
      toast({
        title: "Erro de validação",
        description: "Nome do desafio é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (name.length > 100) {
      toast({
        title: "Erro de validação",
        description: "Nome deve ter no máximo 100 caracteres",
        variant: "destructive",
      });
      return;
    }

    // Validate optional numeric fields
    try {
      if (alignmentScore < 1 || alignmentScore > 10) {
        throw new Error("Alinhamento deve estar entre 1 e 10");
      }
      if (durationDays < 1 || durationDays > 365) {
        throw new Error("Duração deve estar entre 1 e 365 dias");
      }
      const diff = parseInt(difficulty);
      if (diff < 1 || diff > 5) {
        throw new Error("Dificuldade deve estar entre 1 e 5");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate habits
    if (habits.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um hábito",
        variant: "destructive",
      });
      return;
    }

    // Validate habits - only title is required
    for (const habit of habits) {
      if (!habit.title || habit.title.trim().length === 0) {
        toast({
          title: "Erro de validação nos hábitos",
          description: "Todos os hábitos devem ter um título",
          variant: "destructive",
        });
        return;
      }
      if (habit.title.length > 100) {
        toast({
          title: "Erro de validação nos hábitos",
          description: "Título do hábito deve ter no máximo 100 caracteres",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      const startDate = new Date(challengeData?.start_date || new Date());
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);

      // Update challenge
      const { error: challengeUpdateError } = await supabase
        .from("challenges")
        .update({
          name,
          duration_days: durationDays,
          difficulty: parseInt(difficulty),
          alignment_score: alignmentScore,
          end_date: endDate.toISOString().split("T")[0],
        })
        .eq("id", challengeId);

      if (challengeUpdateError) throw challengeUpdateError;

      // Handle habits: delete removed, update existing, insert new
      const existingHabitIds = challengeData?.challenge_items.map((item: any) => item.id) || [];
      const currentHabitIds = habits.map((h) => h.id);

      // Habits to delete
      const habitsToDelete = existingHabitIds.filter(
        (id: string) => !currentHabitIds.includes(id)
      );
      if (habitsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("challenge_items")
          .delete()
          .in("id", habitsToDelete);
        if (deleteError) throw deleteError;
      }

      // Habits to update/insert
      const habitPromises = habits.map(async (habit, index) => {
        const commonData = {
          title: habit.title,
          description: habit.description,
          priority: habit.priority as "imprescindivel" | "importante" | "acessorio",
          facilitators: habit.facilitators || null,
          position: index,
        };

        if (existingHabitIds.includes(habit.id)) {
          // Update existing habit
          const { error: updateError } = await supabase
            .from("challenge_items")
            .update(commonData)
            .eq("id", habit.id);
          if (updateError) throw updateError;
        } else {
          // Insert new habit
          const { error: insertError } = await supabase
            .from("challenge_items")
            .insert({
              ...commonData,
              challenge_id: challengeId,
            });
          if (insertError) throw insertError;
        }
      });

      await Promise.all(habitPromises);

      queryClient.invalidateQueries({ queryKey: ["active-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["challenge-to-edit", challengeId] });
      queryClient.invalidateQueries({ queryKey: ["challenge-items", challengeId] });

      toast({
        title: "✅ Desafio atualizado!",
        description: "Seu desafio ativo foi salvo com sucesso.",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o desafio",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (challengeLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando Desafio...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Desafio Ativo</DialogTitle>
          <DialogDescription>
            Ajuste os detalhes e hábitos do seu desafio atual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Desafio *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Meu Desafio de 30 Dias"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>
              O quanto esse desafio se relaciona com seus sonhos e objetivos de vida? {getEmoji(alignmentScore)} {alignmentScore}/10
            </Label>
            <Slider
              value={[alignmentScore]}
              onValueChange={([value]) => setAlignmentScore(value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Nível de Dificuldade *</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Muito Fácil</SelectItem>
                <SelectItem value="2">2 - Fácil</SelectItem>
                <SelectItem value="3">3 - Médio</SelectItem>
                <SelectItem value="4">4 - Difícil</SelectItem>
                <SelectItem value="5">5 - Muito Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (dias) *</Label>
            <Input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Número de dias"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Hábitos do Desafio *</Label>
              <Button onClick={addHabit} variant="outline" size="sm" type="button">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Hábito
              </Button>
            </div>

            {habits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum hábito adicionado ainda. Clique em "Adicionar Hábito" para começar.
              </p>
            ) : (
              <div className="space-y-4">
                {habits.map((habit, index) => (
                  <Card key={habit.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-medium">Hábito {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHabit(habit.id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground font-medium">Nome do hábito *</Label>
                        <Input
                          value={habit.title}
                          onChange={(e) => updateHabit(habit.id, "title", e.target.value)}
                          placeholder="Ex: Beber 2L de água"
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground font-medium">Descrição (opcional)</Label>
                        <Textarea
                          value={habit.description}
                          onChange={(e) => updateHabit(habit.id, "description", e.target.value)}
                          placeholder="Descreva o hábito em detalhes"
                          rows={2}
                          maxLength={500}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground font-medium">Facilitadores (opcional)</Label>
                        <Textarea
                          value={habit.facilitators}
                          onChange={(e) => updateHabit(habit.id, "facilitators", e.target.value)}
                          placeholder="O que você pode fazer para tornar este hábito mais fácil?"
                          rows={2}
                          maxLength={500}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground font-medium">Nível de urgência (opcional)</Label>
                        <Select
                          value={habit.priority}
                          onValueChange={(value) => updateHabit(habit.id, "priority", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível de urgência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="imprescindivel">Imprescindível</SelectItem>
                            <SelectItem value="importante">Importante</SelectItem>
                            <SelectItem value="acessorio">Acessório</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}