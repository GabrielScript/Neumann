import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { challengeSchema, habitSchema } from "@/lib/validation";
import { z } from "zod";

interface Habit {
  id: string;
  title: string;
  description: string;
  priority: string;
  facilitators: string;
}

interface CreateChallengeTabProps {
  onChallengeCreated: () => void;
}

export function CreateChallengeTab({ onChallengeCreated }: CreateChallengeTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkDailyChallengeLimit } = useSubscription();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("3");
  const [duration, setDuration] = useState("21");
  const [customDuration, setCustomDuration] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const addHabit = () => {
    setHabits([
      ...habits,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        priority: "importante",
        facilitators: "",
      },
    ]);
  };

  const removeHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
  };

  const updateHabit = (id: string, field: keyof Habit, value: string) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const handleCreate = async () => {
    if (!user?.id) return;

    // Validate challenge data
    try {
      const durationDays = duration === "custom" ? parseInt(customDuration) : parseInt(duration);
      
      challengeSchema.parse({
        name,
        description,
        duration_days: durationDays,
        difficulty: parseInt(difficulty),
      });
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

    try {
      for (const habit of habits) {
        habitSchema.parse({
          title: habit.title,
          description: habit.description,
          priority: habit.priority,
          facilitators: habit.facilitators,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação nos hábitos",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Verificar limite de desafios ativos
    const canCreate = await checkDailyChallengeLimit();
    if (!canCreate) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de desafios ativos do seu plano.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const durationDays =
        duration === "custom" ? parseInt(customDuration) : parseInt(duration);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // Create challenge
      const { data: newChallenge, error: challengeError } = await supabase
        .from("challenges")
        .insert({
          user_id: user.id,
          name,
          duration_days: durationDays,
          difficulty: parseInt(difficulty),
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          is_active: true,
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Create items
      const items = habits.map((habit, index) => ({
        challenge_id: newChallenge.id,
        title: habit.title,
        description: habit.description,
        priority: habit.priority as "imprescindivel" | "importante" | "acessorio",
        facilitators: habit.facilitators || null,
        position: index,
      }));

      const { error: itemsError } = await supabase
        .from("challenge_items")
        .insert(items);

      if (itemsError) throw itemsError;

      queryClient.invalidateQueries({ queryKey: ["active-challenges"] });
      
      toast({
        title: "🚀 Desafio criado!",
        description: "Seu desafio personalizado foi iniciado com sucesso!",
      });

      // Reset form
      setName("");
      setDescription("");
      setDifficulty("3");
      setDuration("21");
      setHabits([]);
      
      onChallengeCreated();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o desafio",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Desafio Personalizado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <Label htmlFor="description">Descrição *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explique o que é e como funciona seu desafio"
            rows={3}
            maxLength={1000}
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
          <Label htmlFor="duration">Duração *</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 dia</SelectItem>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="21">21 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="75">75 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {duration === "custom" && (
            <Input
              type="number"
              min="1"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              placeholder="Número de dias"
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Hábitos do Desafio *</Label>
            <Button onClick={addHabit} variant="outline" size="sm">
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
                      <Label className="text-foreground font-medium">Descrição *</Label>
                      <Textarea
                        value={habit.description}
                        onChange={(e) => updateHabit(habit.id, "description", e.target.value)}
                        placeholder="Descreva o hábito em detalhes"
                        rows={2}
                        maxLength={500}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground font-medium">Facilitadores *</Label>
                      <Textarea
                        value={habit.facilitators}
                        onChange={(e) => updateHabit(habit.id, "facilitators", e.target.value)}
                        placeholder="O que você pode fazer para tornar este hábito mais fácil?"
                        rows={2}
                        maxLength={500}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground font-medium">Nível de urgência *</Label>
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

        <Button
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full"
          size="lg"
        >
          {isCreating ? "Criando..." : "Iniciar Desafio"}
        </Button>
      </CardContent>
    </Card>
  );
}