import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommunityRankings } from "@/hooks/useCommunityRankings";
import { RankingList } from "@/components/community/RankingList";
import { UserProfileModal } from "@/components/community/UserProfileModal";
import { Trophy, Flame, TrendingUp, Target, Sparkles } from "lucide-react";

const Rankings = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const {
    levelRanking,
    currentStreakRanking,
    bestStreakRanking,
    lifeGoalTrophiesRanking,
    challengesCompletedRanking,
    isLoading: rankingsLoading,
  } = useCommunityRankings();

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileModalOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-7 h-7 text-primary" />
              Rankings Globais
            </CardTitle>
            <CardDescription className="mt-2">
              Veja os rankings de todos os usuários do Neumann
            </CardDescription>
          </CardHeader>

          <CardContent>
            {rankingsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando rankings...</p>
              </div>
            ) : (
              <Tabs defaultValue="level" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="level" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline">Nível</span>
                  </TabsTrigger>
                  <TabsTrigger value="streak" className="flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    <span className="hidden sm:inline">Dias Seguidos</span>
                  </TabsTrigger>
                  <TabsTrigger value="best_streak" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Melhor Sequência</span>
                  </TabsTrigger>
                  <TabsTrigger value="goals" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Objetivos</span>
                  </TabsTrigger>
                  <TabsTrigger value="challenges" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Desafios</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="level">
                  <RankingList 
                    data={levelRanking} 
                    type="level" 
                    onViewProfile={handleViewProfile}
                  />
                </TabsContent>

                <TabsContent value="streak">
                  <RankingList 
                    data={currentStreakRanking} 
                    type="current_streak" 
                    onViewProfile={handleViewProfile}
                  />
                </TabsContent>

                <TabsContent value="best_streak">
                  <RankingList 
                    data={bestStreakRanking} 
                    type="best_streak" 
                    onViewProfile={handleViewProfile}
                  />
                </TabsContent>

                <TabsContent value="goals">
                  <RankingList 
                    data={lifeGoalTrophiesRanking} 
                    type="life_goals" 
                    onViewProfile={handleViewProfile}
                  />
                </TabsContent>

                <TabsContent value="challenges">
                  <RankingList 
                    data={challengesCompletedRanking} 
                    type="challenges" 
                    onViewProfile={handleViewProfile}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      <UserProfileModal
        userId={selectedUserId}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </Layout>
  );
};

export default Rankings;
