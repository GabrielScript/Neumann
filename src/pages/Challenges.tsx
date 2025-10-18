import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveChallenge } from "@/hooks/useActiveChallenge";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

// Lazy load dos componentes pesados
const ActiveChallengeTab = lazy(() => import("@/components/challenges/ActiveChallengeTab").then(m => ({ default: m.ActiveChallengeTab })));
const ChallengeLibraryTab = lazy(() => import("@/components/challenges/ChallengeLibraryTab").then(m => ({ default: m.ChallengeLibraryTab })));
const CreateChallengeTab = lazy(() => import("@/components/challenges/CreateChallengeTab").then(m => ({ default: m.CreateChallengeTab })));

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
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
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
            </Suspense>
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <ChallengeLibraryTab onChallengeStarted={() => setActiveTab("active")} />
            </Suspense>
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <CreateChallengeTab onChallengeCreated={() => setActiveTab("active")} />
            </Suspense>
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
