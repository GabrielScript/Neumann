import { RankingEntry } from "@/hooks/useCommunityRankings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Eye, MessageCircle, Zap } from "lucide-react";
import { getTrophyStageName } from "@/lib/xp";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";

interface RankingListProps {
  data: RankingEntry[];
  type: 'level' | 'current_streak' | 'best_streak' | 'life_goals' | 'challenges';
  onViewProfile: (userId: string) => void;
  onStartChat?: (userId: string, userName: string) => void;
  currentUserId?: string;
}

const getValueLabel = (type: RankingListProps['type'], value: number) => {
  switch (type) {
    case 'level':
      return `Nível ${value}`;
    case 'current_streak':
      return `${value} dias`;
    case 'best_streak':
      return `${value} dias`;
    case 'life_goals':
      return `${value} objetivos`;
    case 'challenges':
      return `${value} desafios`;
  }
};

export const RankingList = ({ data, type, onViewProfile, onStartChat, currentUserId }: RankingListProps) => {
  
  // Calcular turbo XP baseado na posição e assinatura
  const getTurboXP = (position: number, isPlus: boolean, tier?: string) => {
    let turbo = 0;
    
    // Multiplicador base por tier
    if (tier === 'plus_monthly') turbo += 1.5;
    else if (tier === 'plus_annual') turbo += 2.5;
    
    // Multiplicador por posição
    if (position === 1) turbo += 10;
    else if (position === 2) turbo += 7.5;
    else if (position === 3) turbo += 5;
    else if (position >= 4 && position <= 10) turbo += 3;
    
    return turbo > 0 ? turbo : null;
  };
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum membro encontrado nesta comunidade.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((entry) => {
        const isTop3 = entry.position <= 3;
        const borderColor = 
          entry.position === 1 ? 'border-yellow-400' :
          entry.position === 2 ? 'border-gray-400' :
          entry.position === 3 ? 'border-amber-600' :
          'border-accent/30';
        
        const bgGradient = 
          entry.position === 1 ? 'bg-gradient-to-r from-yellow-400/10 to-orange-500/10' :
          entry.position === 2 ? 'bg-gradient-to-r from-gray-300/10 to-gray-400/10' :
          entry.position === 3 ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/10' :
          'bg-background/50';

        return (
          <div
            key={entry.userId}
            className={cn(
              "p-4 rounded-xl border-2 backdrop-blur-sm transition-all duration-300",
              "hover:border-primary/50 hover:shadow-glow",
              borderColor,
              bgGradient
            )}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Position and Medal */}
              <div className="flex items-center gap-3 min-w-[80px]">
                <span className={cn(
                  "text-2xl font-black font-display",
                  isTop3 ? "text-primary" : "text-muted-foreground"
                )}>
                  {entry.medal ? entry.medal : `#${entry.position}`}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-foreground truncate">
                    {entry.userName}
                  </h3>
                  {entry.isPlus && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0 text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Plus
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-body font-bold text-primary">
                    {getValueLabel(type, entry.value)}
                  </span>
                  {(() => {
                    const turbo = getTurboXP(entry.position, entry.isPlus);
                    return turbo && (
                      <>
                        <span className="text-xs">•</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-green-500">
                          <Zap className="w-3 h-3" />
                          +{turbo}% Turbo XP
                        </span>
                      </>
                    );
                  })()}
                  <span className="text-xs">•</span>
                  <span className="text-xs truncate">
                    {getTrophyStageName(entry.trophyStage as any)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProfile(entry.userId)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Perfil
                </Button>
                
                {onStartChat && currentUserId && entry.userId !== currentUserId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStartChat(entry.userId, entry.userName)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
