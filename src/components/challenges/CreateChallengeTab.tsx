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

interface Habit {
  id: string;
  title: string;
  description: string;
  priority: string;
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

    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do desafio é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (habits.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um hábito",
        variant: "destructive",
      });
      return;
    }

    const invalidHabit = habits.find((h) => !h.title.trim());
    if (invalidHabit) {
      toast({
        title: "Erro",
        description: "Todos os hábitos precisam ter um título",
        variant: "destructive",
      });
      return;
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
        description: habit.description || null,
        priority: habit.priority as "imprescindivel" | "importante" | "acessorio",
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
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva os objetivos do seu desafio..."
            rows={3}
          />
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
                  <CardContent className="pt-6 space-y-3">
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

                    <Input
                      value={habit.title}
                      onChange={(e) => updateHabit(habit.id, "title", e.target.value)}
                      placeholder="Nome do hábito *"
                    />

                    <Textarea
                      value={habit.description}
                      onChange={(e) => updateHabit(habit.id, "description", e.target.value)}
                      placeholder="Descrição (opcional)"
                      rows={2}
                    />

                    <Select
                      value={habit.priority}
                      onValueChange={(value) => updateHabit(habit.id, "priority", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imprescindivel">Imprescindível</SelectItem>
                        <SelectItem value="importante">Importante</SelectItem>
                        <SelectItem value="acessorio">Acessório</SelectItem>
                      </SelectContent>
                    </Select>
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
