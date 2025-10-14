import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveChallenge } from "@/hooks/useActiveChallenge";
import { ActiveChallengeTab } from "@/components/challenges/ActiveChallengeTab";
import { ChallengeLibraryTab } from "@/components/challenges/ChallengeLibraryTab";
import { CreateChallengeTab } from "@/components/challenges/CreateChallengeTab";

export default function Challenges() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { challenge } = useActiveChallenge();
  const [activeTab, setActiveTab] = useState(challenge ? "active" : "library");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Desafios</h1>
          <p className="text-muted-foreground">
            Transforme sua vida com desafios estruturados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" disabled={!challenge}>
              Desafio Ativo
            </TabsTrigger>
            <TabsTrigger value="library">Biblioteca</TabsTrigger>
            <TabsTrigger value="create">Criar Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {challenge ? (
              <ActiveChallengeTab challenge={challenge} />
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  Você não tem um desafio ativo no momento.
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
      </div>
    </Layout>
  );
}
