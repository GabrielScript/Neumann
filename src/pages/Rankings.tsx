import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommunity } from "@/hooks/useCommunity";
import { useCommunityRankings } from "@/hooks/useCommunityRankings";
import { RankingList } from "@/components/community/RankingList";
import { UserProfileModal } from "@/components/community/UserProfileModal";
import { Trophy, Flame, TrendingUp, Target, Sparkles, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Rankings = () => {
  const { userCommunities, isLoading: communitiesLoading } = useCommunity();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const {
    levelRanking,
    currentStreakRanking,
    bestStreakRanking,
    lifeGoalTrophiesRanking,
    challengesCompletedRanking,
    isLoading: rankingsLoading,
  } = useCommunityRankings(selectedCommunityId);

  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunityId(communityId);
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileModalOpen(true);
  };

  // Auto-select first community if available
  if (!selectedCommunityId && userCommunities.length > 0 && !communitiesLoading) {
    setSelectedCommunityId(userCommunities[0].id);
  }

  if (communitiesLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando comunidades...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (userCommunities.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Rankings da Comunidade
              </CardTitle>
              <CardDescription>
                Veja os rankings dos membros da sua comunidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Você ainda não é membro de nenhuma comunidade. 
                  <br />
                  Para acessar os rankings, você precisa ter uma assinatura Plus e fazer parte de uma comunidade.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Trophy className="w-7 h-7 text-primary" />
                  Rankings da Comunidade
                </CardTitle>
                <CardDescription className="mt-2">
                  Veja os rankings dos membros da comunidade
                </CardDescription>
              </div>
              
              <Select 
                value={selectedCommunityId || undefined} 
                onValueChange={handleCommunityChange}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Selecione uma comunidade" />
                </SelectTrigger>
                <SelectContent>
                  {userCommunities.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
