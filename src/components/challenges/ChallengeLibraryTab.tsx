import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { ChallengeCard } from "./ChallengeCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X } from "lucide-react";

interface ChallengeLibraryTabProps {
  onChallengeStarted: () => void;
}

export function ChallengeLibraryTab({ onChallengeStarted }: ChallengeLibraryTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkDailyChallengeLimit, subscription } = useSubscription();
  
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<any[]>([]);
  
  const isPlusUser = subscription?.tier === 'plus_monthly' || subscription?.tier === 'plus_annual';

  const { data: templates, isLoading } = useQuery({
    queryKey: ["challenge-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_templates")
        .select("*")
        .or("is_public.eq.true,is_default.eq.true")
        .order("is_default", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: templateItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["template-items", selectedTemplate?.id],
    queryFn: async () => {
      if (!selectedTemplate) return null;

      const { data, error } = await supabase
        .from("challenge_items")
        .select("*")
        .eq("template_id", selectedTemplate.id)
        .order("position");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedTemplate,
  });

  const startChallengeMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const template = templates?.find((t) => t.id === templateId);
      if (!template) throw new Error("Template not found");

      // Create challenge
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + template.duration_days);

      const { data: newChallenge, error: challengeError } = await supabase
        .from("challenges")
        .insert({
          user_id: user.id,
          template_id: templateId,
          name: template.name,
          duration_days: template.duration_days,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          is_active: true,
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Clone items
      const { data: items, error: itemsError } = await supabase
        .from("challenge_items")
        .select("*")
        .eq("template_id", templateId);

      if (itemsError) throw itemsError;

      if (items && items.length > 0) {
        const newItems = items.map((item) => ({
          challenge_id: newChallenge.id,
          title: item.title,
          description: item.description,
          priority: item.priority,
          position: item.position,
          reminder_time: item.reminder_time,
          difficulty: item.difficulty,
          alignment_score: item.alignment_score,
          facilitators: item.facilitators,
        }));

        const { error: insertError } = await supabase
          .from("challenge_items")
          .insert(newItems);

        if (insertError) throw insertError;
      }

      return newChallenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-challenges"] });
      toast({
        title: "🚀 Desafio iniciado!",
        description: "Boa sorte na sua jornada!",
      });
      setDetailsOpen(false);
      onChallengeStarted();
    },
  });

  const saveItemsMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const updates = items.map((item) => 
        supabase
          .from("challenge_items")
          .update({
            title: item.title,
            description: item.description,
          })
          .eq("id", item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-items"] });
      toast({
        title: "✅ Alterações salvas",
        description: "O template foi atualizado com sucesso!",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (template: any) => {
    setSelectedTemplate(template);
    setDetailsOpen(true);
    setIsEditing(false);
  };
  
  const handleStartEdit = () => {
    setEditedItems(templateItems || []);
    setIsEditing(true);
  };
  
  const handleSaveEdit = () => {
    saveItemsMutation.mutate(editedItems);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedItems([]);
  };
  
  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditedItems(updated);
  };

  const handleStartChallenge = async (template: any) => {
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
    
    // Se pode criar, inicia o desafio direto
    startChallengeMutation.mutate(template.id);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {templates?.map((template) => (
          <ChallengeCard
            key={template.id}
            template={template}
            onViewDetails={() => handleViewDetails(template)}
          />
        ))}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge>{selectedTemplate?.duration_days} dias</Badge>
              <Badge variant={selectedTemplate?.is_default ? "default" : "secondary"}>
                {selectedTemplate?.is_default ? "Padrão" : "Comunidade"}
              </Badge>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Hábitos do Desafio:</h3>
                {isPlusUser && !isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleStartEdit}
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </Button>
                )}
                {isEditing && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelEdit}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={saveItemsMutation.isPending}
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </Button>
                  </div>
                )}
              </div>
              {itemsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : (
                <div className="space-y-2">
                  {(isEditing ? editedItems : templateItems)?.map((item, index) => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div>
                            <label className="text-sm font-medium">Título:</label>
                            <Input
                              value={item.title}
                              onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Descrição:</label>
                            <Textarea
                              value={item.description || ''}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              {index + 1}. {item.title}
                            </p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isEditing && (
              <Button
                onClick={() => handleStartChallenge(selectedTemplate)}
                className="w-full"
                size="lg"
              >
                Iniciar Desafio
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
