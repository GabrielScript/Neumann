import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface ChallengeCardProps {
  template: {
    id: string;
    name: string;
    description: string | null;
    duration_days: number;
    is_default: boolean;
    is_public: boolean;
  };
  onViewDetails: () => void;
}

export function ChallengeCard({ template, onViewDetails }: ChallengeCardProps) {
  return (
    <Card className="hover-scale">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{template.name}</CardTitle>
          <Badge variant={template.is_default ? "default" : "secondary"}>
            {template.is_default ? "Padrão" : "Comunidade"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {template.description || "Sem descrição"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{template.duration_days} dias</span>
          </div>
          <Button onClick={onViewDetails} variant="outline">
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
