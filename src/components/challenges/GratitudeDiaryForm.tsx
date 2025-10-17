import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, History } from "lucide-react";
import { useGratitudeDiary } from "@/hooks/useGratitudeDiary";
import { GratitudeDiaryHistoryModal } from "./GratitudeDiaryHistoryModal";

interface GratitudeDiaryFormProps {
  challengeId: string;
  challengeName: string;
  challengeStartDate: string;
}

export function GratitudeDiaryForm({
  challengeId,
  challengeName,
  challengeStartDate,
}: GratitudeDiaryFormProps) {
  const { todayEntry, history, isLoading, saveGratitudeDiary, isSaving, calculateDayNumber } =
    useGratitudeDiary(challengeId, challengeStartDate);

  const [showHistory, setShowHistory] = useState(false);
  const [gratitude1, setGratitude1] = useState("");
  const [gratitude2, setGratitude2] = useState("");
  const [gratitude3, setGratitude3] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const dayNumber = calculateDayNumber(today);

  // Carregar dados existentes quando disponíveis
  useEffect(() => {
    if (todayEntry) {
      setGratitude1(todayEntry.gratitude_1 || "");
      setGratitude2(todayEntry.gratitude_2 || "");
      setGratitude3(todayEntry.gratitude_3 || "");
    }
  }, [todayEntry]);

  const handleSubmit = () => {
    saveGratitudeDiary({
      challenge_id: challengeId,
      date: today,
      day_number: dayNumber,
      gratitude_1: gratitude1,
      gratitude_2: gratitude2,
      gratitude_3: gratitude3,
    });
  };

  const isFormComplete = gratitude1.trim() && gratitude2.trim() && gratitude3.trim();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              {challengeName}
            </CardTitle>
            {history && history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
              >
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Dia {dayNumber}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              Dedique alguns minutos do seu dia para reconhecer e registrar as coisas boas da sua vida. 
              A gratidão transforma o que temos em suficiente e nos ajuda a focar no que realmente importa. 
              Escreva três coisas pelas quais você é grato hoje. ✨
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Gratidão 1:
              </label>
              <Textarea
                placeholder="Escreva algo pelo qual você é grato..."
                value={gratitude1}
                onChange={(e) => setGratitude1(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Gratidão 2:
              </label>
              <Textarea
                placeholder="Escreva algo pelo qual você é grato..."
                value={gratitude2}
                onChange={(e) => setGratitude2(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Gratidão 3:
              </label>
              <Textarea
                placeholder="Escreva algo pelo qual você é grato..."
                value={gratitude3}
                onChange={(e) => setGratitude3(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="bg-secondary/20 border border-secondary/30 rounded-lg p-4">
            <p className="text-sm text-foreground">
              Lembre-se: não existem gratidões pequenas ou grandes demais. O importante é reconhecer 
              genuinamente o que traz alegria e significado para sua vida. Com o tempo, você perceberá 
              uma transformação na sua perspectiva e bem-estar. 🌟
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isFormComplete || isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? "Salvando..." : todayEntry ? "Atualizar Gratidões" : "Salvar Gratidões"}
          </Button>
        </CardContent>
      </Card>

      {history && (
        <GratitudeDiaryHistoryModal
          open={showHistory}
          onOpenChange={setShowHistory}
          history={history}
          challengeName={challengeName}
        />
      )}
    </>
  );
}
