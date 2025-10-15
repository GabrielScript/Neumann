import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Trash2, CheckCircle2 } from "lucide-react";

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    deadline?: string | null;
    happiness_level?: number | null;
    motivation?: string | null;
    action_plan?: string | null;
    is_completed: boolean;
  };
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

const getHappinessEmoji = (level: number | null | undefined) => {
  if (!level) return "😐";
  if (level <= 3) return "😐";
  if (level <= 6) return "😊";
  return "🤩";
};

const getDaysRemaining = (deadline: string | null | undefined) => {
  if (!deadline) return null;
  
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "Prazo vencido";
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  return `${diffDays} dias restantes`;
};

export function GoalCard({ goal, onEdit, onComplete, onDelete }: GoalCardProps) {
  const daysRemaining = getDaysRemaining(goal.deadline);
  const emoji = getHappinessEmoji(goal.happiness_level);

  return (
    <Card className="hover-scale">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{goal.title}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {emoji} {goal.happiness_level || 5}/10
          </Badge>
        </div>
        {daysRemaining && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{daysRemaining}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {goal.motivation && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {goal.motivation}
          </p>
        )}
        <div className="flex gap-2">
          {!goal.is_completed && (
            <>
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="default" onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
