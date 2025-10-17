import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useDiaryEntry } from "@/hooks/useDiaryEntry";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Save, History } from "lucide-react";
import { DiaryHistoryModal } from "./DiaryHistoryModal";

interface DiaryEntryFormProps {
  challengeId: string;
  challengeStartDate: string;
}

export function DiaryEntryForm({ challengeId, challengeStartDate }: DiaryEntryFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const { todayEntry, isLoading, saveDiary, isSaving, calculateDayNumber } = useDiaryEntry(
    challengeId,
    challengeStartDate
  );

  const [showHistory, setShowHistory] = useState(false);
  const dayNumber = calculateDayNumber(today);

  // Form state
  const [reasonToLive, setReasonToLive] = useState("");
  const [worldContribution, setWorldContribution] = useState("");
  const [changePast, setChangePast] = useState("");
  const [actions, setActions] = useState(["", "", "", "", "", ""]);
  const [beliefScore, setBeliefScore] = useState(5);
  const [beliefArguments, setBeliefArguments] = useState("");
  const [gratitudes, setGratitudes] = useState(["", "", ""]);
  const [forgivenessCompleted, setForgivenessCompleted] = useState(false);
  const [learnings, setLearnings] = useState("");

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    section1: true,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
  });

  // Load existing entry
  useEffect(() => {
    if (todayEntry) {
      setReasonToLive(todayEntry.reason_to_live || "");
      setWorldContribution(todayEntry.world_contribution || "");
      setChangePast(todayEntry.change_past || "");
      setActions([
        todayEntry.action_1 || "",
        todayEntry.action_2 || "",
        todayEntry.action_3 || "",
        todayEntry.action_4 || "",
        todayEntry.action_5 || "",
        todayEntry.action_6 || "",
      ]);
      setBeliefScore(todayEntry.actions_belief_score || 5);
      setBeliefArguments(todayEntry.actions_belief_arguments || "");
      setGratitudes([
        todayEntry.gratitude_1 || "",
        todayEntry.gratitude_2 || "",
        todayEntry.gratitude_3 || "",
      ]);
      setForgivenessCompleted(todayEntry.forgiveness_completed);
      setLearnings(todayEntry.learnings || "");
    }
  }, [todayEntry]);

  const handleSave = () => {
    // Validações
    if (!reasonToLive.trim()) {
      alert("Por favor, preencha por que valeu a pena viver o dia de hoje.");
      return;
    }
    if (!worldContribution.trim()) {
      alert("Por favor, preencha sua ideia para contribuir com um mundo melhor.");
      return;
    }
    if (actions.filter((a) => a.trim()).length < 3) {
      alert("Por favor, preencha pelo menos 3 ações para amanhã.");
      return;
    }
    if (!gratitudes[0].trim()) {
      alert("Por favor, preencha pelo menos 1 gratidão.");
      return;
    }
    if (!learnings.trim()) {
      alert("Por favor, preencha seus aprendizados do dia.");
      return;
    }

    saveDiary({
      challenge_id: challengeId,
      date: today,
      day_number: dayNumber,
      reason_to_live: reasonToLive,
      world_contribution: worldContribution,
      change_past: changePast,
      action_1: actions[0],
      action_2: actions[1],
      action_3: actions[2],
      action_4: actions[3],
      action_5: actions[4],
      action_6: actions[5],
      actions_belief_score: beliefScore,
      actions_belief_arguments: beliefArguments,
      gratitude_1: gratitudes[0],
      gratitude_2: gratitudes[1],
      gratitude_3: gratitudes[2],
      forgiveness_completed: forgivenessCompleted,
      learnings: learnings,
    });
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Diário de Bordo - Dia {dayNumber}/40</CardTitle>
              <CardDescription>
                Preencha todas as seções para registrar seu dia
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowHistory(true)}>
              <History className="w-4 h-4 mr-2" />
              Histórico
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seção 1: Reflexões do Dia */}
          <Collapsible open={openSections.section1} onOpenChange={() => toggleSection("section1")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <h3 className="text-lg font-semibold">1. Reflexões do Dia</h3>
              {openSections.section1 ? <ChevronUp /> : <ChevronDown />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div>
                <Label>Por que valeu a pena viver o dia de hoje? *</Label>
                <Textarea
                  value={reasonToLive}
                  onChange={(e) => setReasonToLive(e.target.value)}
                  placeholder="Descreva o que fez este dia valer a pena..."
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label>
                  Que ideia você pode ter hoje para contribuir para a construção de um mundo melhor?
                  Como você pode colocar isso em prática? *
                </Label>
                <Textarea
                  value={worldContribution}
                  onChange={(e) => setWorldContribution(e.target.value)}
                  placeholder="Sua ideia para um mundo melhor..."
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label>
                  Se você pudesse voltar no tempo e modificar algum acontecimento no dia de hoje, o que
                  faria de diferente?
                </Label>
                <Textarea
                  value={changePast}
                  onChange={(e) => setChangePast(e.target.value)}
                  placeholder="O que você mudaria..."
                  className="min-h-[100px]"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Seção 2: Ações para Amanhã */}
          <Collapsible open={openSections.section2} onOpenChange={() => toggleSection("section2")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <h3 className="text-lg font-semibold">2. Ações para Amanhã</h3>
              {openSections.section2 ? <ChevronUp /> : <ChevronDown />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div>
                <Label>Seis ações que você se compromete a realizar amanhã (mínimo 3) *</Label>
                {actions.map((action, index) => (
                  <Input
                    key={index}
                    value={action}
                    onChange={(e) => {
                      const newActions = [...actions];
                      newActions[index] = e.target.value;
                      setActions(newActions);
                    }}
                    placeholder={`${index + 1}. Ação`}
                    className="mt-2"
                  />
                ))}
              </div>
              <div>
                <Label>
                  Numa escala de 0-10, o quanto você acredita que essas ações contribuirão para um dia
                  produtivo amanhã?
                </Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[beliefScore]}
                    onValueChange={(value) => setBeliefScore(value[0])}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold w-12 text-center">{beliefScore}</span>
                </div>
              </div>
              <div>
                <Label>Com quais argumentos você confirma sua nota?</Label>
                <Textarea
                  value={beliefArguments}
                  onChange={(e) => setBeliefArguments(e.target.value)}
                  placeholder="Seus argumentos..."
                  className="min-h-[100px]"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Seção 3: Gratidão */}
          <Collapsible open={openSections.section3} onOpenChange={() => toggleSection("section3")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <h3 className="text-lg font-semibold">3. Gratidão</h3>
              {openSections.section3 ? <ChevronUp /> : <ChevronDown />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div>
                <Label>
                  Agradeça três acontecimentos, emoções, sentimentos ou conquistas do dia de hoje (suas
                  "bênçãos diárias") *
                </Label>
                {gratitudes.map((gratitude, index) => (
                  <Input
                    key={index}
                    value={gratitude}
                    onChange={(e) => {
                      const newGratitudes = [...gratitudes];
                      newGratitudes[index] = e.target.value;
                      setGratitudes(newGratitudes);
                    }}
                    placeholder={`${index + 1}. Gratidão`}
                    className="mt-2"
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Seção 4: Meditação do Perdão */}
          <Collapsible open={openSections.section4} onOpenChange={() => toggleSection("section4")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <h3 className="text-lg font-semibold">4. Meditação do Perdão</h3>
              {openSections.section4 ? <ChevronUp /> : <ChevronDown />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-4 text-sm">
                <p>
                  <strong>1.</strong> Por todas as coisas que eu mesmo me feri, me magoei, me prejudiquei,
                  consciente ou inconscientemente, sabendo o que estava fazendo, ou sem saber, eu me perdoo e
                  me liberto. Eu me aceito do jeito que eu sou. Eu sou [seu nome completo]
                </p>
                <p>
                  <strong>2.</strong> Por todas as pessoas que nesse mundo me magoaram, me ofenderam, me
                  prejudicaram de forma consciente ou inconsciente, direta ou indiretamente, eu perdoo cada uma
                  dessas pessoas. Eu me desconecto delas neste momento. Eu me perdoo. Eu me liberto. Eu me
                  aceito do jeito que sou. Eu sou [seu nome]
                </p>
                <p>
                  <strong>3.</strong> Por todas as pessoas nesse mundo que eu prejudiquei, magoei, ofendi, por
                  pensamentos ou palavras, gestos ou emoções, consciente ou inconscientemente, eu peço perdão ao
                  Universo. Eu peço perdão a cada uma dessas pessoas. Eu me desconecto delas. Eu me aceito do
                  jeito que eu sou. Eu sou [seu nome]
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="forgiveness"
                  checked={forgivenessCompleted}
                  onCheckedChange={(checked) => setForgivenessCompleted(checked as boolean)}
                />
                <Label htmlFor="forgiveness" className="cursor-pointer">
                  Li e pratiquei a meditação do perdão
                </Label>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Seção 5: Conclusão / Aprendizados */}
          <Collapsible open={openSections.section5} onOpenChange={() => toggleSection("section5")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <h3 className="text-lg font-semibold">5. Conclusão / Aprendizados</h3>
              {openSections.section5 ? <ChevronUp /> : <ChevronDown />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div>
                <Label>
                  Quais foram os aprendizados que você teve ao fazer o seu diário de bordo no dia de hoje? O
                  que você conclui do dia de hoje? *
                </Label>
                <Textarea
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                  placeholder="Seus aprendizados e conclusões..."
                  className="min-h-[150px]"
                />
              </div>
              <p className="text-sm text-muted-foreground italic">
                Agora tudo está em seu lugar. Potencializamos os fatos bons e maravilhosos do dia.
                Permitimo-nos dar a eles um novo significado e transformá-los em aprendizados. Declaramos,
                planejamos, agimos e agradecemos. Resta uma profunda paz interior, estado de relaxamento maior.
                Permita-se estar confortável e pronto para uma noite de sono restauradora! BOA NOITE... DURMA EM
                PAZ!
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Diário"}
          </Button>
        </CardContent>
      </Card>

      <DiaryHistoryModal
        open={showHistory}
        onOpenChange={setShowHistory}
        challengeId={challengeId}
      />
    </>
  );
}
