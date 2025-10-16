import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { lifeGoalSchema } from "@/lib/validation";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GoalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (goal: {
    title: string;
    deadline: string;
    happiness_level: number;
    motivation: string;
    action_plan: string;
  }) => void;
  initialData?: {
    title: string;
    deadline?: string | null;
    happiness_level?: number | null;
    motivation?: string | null;
    action_plan?: string | null;
  };
}

export function GoalFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: GoalFormModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [deadline, setDeadline] = useState<Date | undefined>(
    initialData?.deadline ? new Date(initialData.deadline) : undefined
  );
  const [happinessLevel, setHappinessLevel] = useState(
    initialData?.happiness_level || 5
  );
  const [motivation, setMotivation] = useState(initialData?.motivation || "");
  const [actionPlan, setActionPlan] = useState(initialData?.action_plan || "");
  const { toast } = useToast();

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || "");
      setDeadline(initialData?.deadline ? new Date(initialData.deadline) : undefined);
      setHappinessLevel(initialData?.happiness_level || 5);
      setMotivation(initialData?.motivation || "");
      setActionPlan(initialData?.action_plan || "");
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deadline) {
      toast({
        title: "Erro de validação",
        description: "O prazo é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    const deadlineString = format(deadline, 'yyyy-MM-dd');
    
    // Validate goal data
    try {
      lifeGoalSchema.parse({
        title,
        deadline: deadlineString,
        happiness_level: happinessLevel,
        motivation,
        action_plan: actionPlan,
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
    
    onSubmit({
      title,
      deadline: deadlineString,
      happiness_level: happinessLevel,
      motivation,
      action_plan: actionPlan,
    });

    // Reset form
    setTitle("");
    setDeadline(undefined);
    setHappinessLevel(5);
    setMotivation("");
    setActionPlan("");
    onOpenChange(false);
  };

  const getEmoji = (level: number) => {
    if (level <= 3) return "😐";
    if (level <= 6) return "😊";
    return "🤩";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Objetivo" : "Novo Objetivo de Vida"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Objetivo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Correr uma maratona"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? (
                    format(deadline, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>
              Nível de Felicidade ao Alcançar {getEmoji(happinessLevel)} {happinessLevel}/10
            </Label>
            <Slider
              value={[happinessLevel]}
              onValueChange={([value]) => setHappinessLevel(value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation">
              Por que esta meta é profundamente importante para mim? *
            </Label>
            <Textarea
              id="motivation"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Descreva suas motivações mais profundas..."
              rows={4}
              maxLength={2000}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_plan">Plano de Ação *</Label>
            <Textarea
              id="action_plan"
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              placeholder="Descreva os passos necessários para alcançar este objetivo..."
              rows={6}
              maxLength={2000}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {initialData ? "Salvar Alterações" : "Criar Objetivo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
