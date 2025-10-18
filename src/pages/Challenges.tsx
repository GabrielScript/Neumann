import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveChallenge } from "@/hooks/useActiveChallenge";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { ActiveChallengeTab } from "@/components/challenges/ActiveChallengeTab";
import { ChallengeLibraryTab } from "@/components/challenges/ChallengeLibraryTab";
import { CreateChallengeTab } from "@/components/challenges/CreateChallengeTab";
import { toast } from "@/hooks/use-toast";

export default function Challenges() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { challenges } = useActiveChallenge();
  const { checkDailyChallengeLimit } = useSubscription();
  const [activeTab, setActiveTab] = useState(challenges && challenges.length > 0 ? "active" : "library");
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleTabChange = async (value: string) => {
    if (value === "create" || value === "library") {
      try {
        const canCreate = await checkDailyChallengeLimit();
        if (!canCreate) {
          setUpgradePromptOpen(true);
          return;
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível verificar o limite de desafios.",
          variant: "destructive",
        });
        return;
      }
    }
    setActiveTab(value);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 lg:mb-8">
          <h1 className="text-responsive-2xl font-bold mb-2 font-display">Desafios</h1>
          <p className="text-responsive-base text-muted-foreground font-body">
            Transforme sua vida com desafios estruturados
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" disabled={!challenges || challenges.length === 0}>
              Desafios Ativos {challenges && challenges.length > 0 && `(${challenges.length})`}
            </TabsTrigger>
            <TabsTrigger value="library">Biblioteca</TabsTrigger>
            <TabsTrigger value="create">Criar Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {challenges && challenges.length > 0 ? (
              <div className="space-y-6">
                {challenges.map((challenge) => (
                  <ActiveChallengeTab key={challenge.id} challenge={challenge} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  Você não tem desafios ativos no momento.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <ChallengeLibraryTab onChallengeStarted={() => setActiveTab("active")} />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <CreateChallengeTab onChallengeCreated={() => setActiveTab("active")} />
          </TabsContent>
        </Tabs>

        <UpgradePrompt 
          open={upgradePromptOpen}
          onOpenChange={setUpgradePromptOpen}
          limitType="challenge"
        />
      </div>
    </Layout>
  );
}
