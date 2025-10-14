import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getTrophyStageName } from "@/lib/xp";
import { Crown, Target, Trophy, TrendingUp, Flame, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileModal = ({ userId, open, onOpenChange }: UserProfileModalProps) => {
  const { profile, isLoading } = useUserProfile(userId);

  if (isLoading || !profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const isPlus = profile.tier !== 'free';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Arsenal de Conquistas - {profile.full_name}
            {isPlus && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0">
                <Crown className="w-3 h-3 mr-1" />
                Plus
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* Nível */}
          <div className="relative p-6 rounded-xl border-2 border-accent/30 bg-background/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-glow transition-all duration-300 group">
            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-16 h-16 text-primary" />
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-primary mb-2 font-display">
                {profile.level}
              </p>
              <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                Nível Atual
              </p>
            </div>
          </div>

          {/* Dias Seguidos */}
          <div className="relative p-6 rounded-xl border-2 border-accent/30 bg-background/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-glow transition-all duration-300 group">
            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Flame className="w-16 h-16 text-orange-500" />
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-primary mb-2 font-display">
                {profile.current_streak}
              </p>
              <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                Dias Seguidos
              </p>
            </div>
          </div>

          {/* Melhor Sequência */}
          <div className="relative p-6 rounded-xl border-2 border-accent/30 bg-background/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-glow transition-all duration-300 group">
            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-green-500" />
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-primary mb-2 font-display">
                {profile.best_streak}
              </p>
              <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                Melhor Sequência
              </p>
            </div>
          </div>

          {/* Objetivos Vencidos */}
          <div className="relative p-6 rounded-xl border-2 border-accent/30 bg-background/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-glow transition-all duration-300 group">
            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-16 h-16 text-yellow-400" />
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-primary mb-2 font-display">
                {profile.life_goal_trophies || 0}
              </p>
              <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                Objetivos Vencidos
              </p>
            </div>
          </div>

          {/* Desafios Conquistados */}
          <div className="relative p-6 rounded-xl border-2 border-accent/30 bg-background/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-glow transition-all duration-300 group">
            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target className="w-16 h-16 text-primary" />
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-primary mb-2 font-display">
                {profile.challenges_completed || 0}
              </p>
              <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                Desafios Conquistados
              </p>
            </div>
          </div>

          {/* Troféu Atual */}
          <div className="relative p-6 rounded-xl border-2 border-accent/30 bg-background/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-glow transition-all duration-300 group">
            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-16 h-16 text-amber-500" />
            </div>
            <div className="relative z-10">
              <p className="text-lg font-black text-primary mb-2 font-display">
                {getTrophyStageName(profile.tree_stage as any)}
              </p>
              <p className="text-sm text-accent/80 uppercase tracking-wider font-body font-bold">
                Troféu Atual
              </p>
            </div>
          </div>
        </div>

        {/* Medalhas Diárias */}
        <div className="mt-6 p-6 rounded-xl border-2 border-accent/30 bg-background/50">
          <h3 className="text-lg font-display font-bold text-foreground mb-4">Medalhas Diárias</h3>
          <div className="flex gap-6 justify-around">
            <div className="text-center">
              <p className="text-3xl font-black text-yellow-500 font-display">
                {profile.daily_medals_gold || 0}
              </p>
              <p className="text-sm text-accent/80 mt-1">🥇 Ouro</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-gray-400 font-display">
                {profile.daily_medals_silver || 0}
              </p>
              <p className="text-sm text-accent/80 mt-1">🥈 Prata</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-amber-600 font-display">
                {profile.daily_medals_bronze || 0}
              </p>
              <p className="text-sm text-accent/80 mt-1">🥉 Bronze</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
