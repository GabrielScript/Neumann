import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { CompletionCelebration } from "@/components/goals/CompletionCelebration";
import { useLifeGoals } from "@/hooks/useLifeGoals";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function Goals() {
  const { activeGoals, completedGoals, isLoading, createGoal, updateGoal, completeGoal, deleteGoal } =
    useLifeGoals();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [completingGoal, setCompletingGoal] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [completedGoalData, setCompletedGoalData] = useState<{ title: string; xp: number } | null>(null);

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleComplete = (goal: any) => {
    setCompletingGoal(goal);
  };

  const confirmComplete = () => {
    if (completingGoal) {
      completeGoal(completingGoal.id);
      setCompletedGoalData({ title: completingGoal.title, xp: 500 });
      setCelebrationOpen(true);
      setCompletingGoal(null);
    }
  };

  const handleDelete = (goalId: string) => {
    setGoalToDelete(goalId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (goalToDelete) {
      deleteGoal(goalToDelete);
      setGoalToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleSubmit = (goalData: any) => {
    if (editingGoal) {
      updateGoal({ id: editingGoal.id, ...goalData });
      setEditingGoal(null);
    } else {
      createGoal(goalData);
    }
    setFormOpen(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Objetivos de Vida</h1>
            <p className="text-muted-foreground">
              Defina e acompanhe suas metas mais importantes
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Novo Objetivo
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <>
            {activeGoals.length === 0 && completedGoals.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  Você ainda não tem objetivos de vida cadastrados.
                </p>
                <Button onClick={() => setFormOpen(true)}>
                  Criar Primeiro Objetivo
                </Button>
              </div>
            ) : (
              <>
                {activeGoals.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Objetivos Ativos</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      {activeGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onEdit={() => handleEdit(goal)}
                          onComplete={() => handleComplete(goal)}
                          onDelete={() => handleDelete(goal.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {completedGoals.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-xl font-semibold mb-4 hover:text-primary transition-colors">
                      Objetivos Concluídos ({completedGoals.length})
                      <ChevronDown className="h-5 w-5" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid gap-6 md:grid-cols-2">
                        {completedGoals.map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onEdit={() => {}}
                            onComplete={() => {}}
                            onDelete={() => handleDelete(goal.id)}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            )}
          </>
        )}

        <GoalFormModal
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingGoal(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingGoal}
        />

        <AlertDialog open={!!completingGoal} onOpenChange={() => setCompletingGoal(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Conclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Parabéns! Você realmente alcançou o objetivo "{completingGoal?.title}"?
                <br />
                <br />
                Você receberá +500 XP como recompensa!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmComplete}>
                Sim, Concluído!
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este objetivo? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {completedGoalData && (
          <CompletionCelebration
            open={celebrationOpen}
            onOpenChange={setCelebrationOpen}
            goalTitle={completedGoalData.title}
            xpAwarded={completedGoalData.xp}
          />
        )}
      </div>
    </Layout>
  );
}
