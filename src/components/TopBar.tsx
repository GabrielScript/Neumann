import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, Moon, Sun, TrendingUp, Flame, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserStats {
  level: number;
  current_streak: number;
  tree_stage: string;
}

export const TopBar = () => {
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    const { data } = await supabase
      .from('user_stats')
      .select('level, current_streak, tree_stage')
      .eq('user_id', user?.id)
      .single();
    
    if (data) setStats(data);
  };

  const getTreeStageName = (stage: string) => {
    const stageNames: { [key: string]: string } = {
      seed: 'Semente',
      sprout: 'Broto',
      young: 'Jovem',
      flourish: 'Frondosa',
      splendid: 'Esplêndida',
    };
    return stageNames[stage] || stage;
  };

  return (
    <header className="h-16 border-b-2 border-primary/20 bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <SidebarTrigger />
      
      <div className="flex items-center gap-3">
        {stats && (
          <>
            <div className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-primary/70 font-body">Nível</p>
                  <p className="font-bold text-lg text-primary font-display">{stats.level}</p>
                </div>
              </div>
            </div>

            <div className="border-2 border-accent/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs text-accent/70 font-body">Sequência</p>
                  <p className="font-bold text-lg text-accent font-display">{stats.current_streak}d</p>
                </div>
              </div>
            </div>

            <div className="border-2 border-primary/50 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-glow">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-primary/70 font-body">Árvore</p>
                  <p className="font-bold text-sm text-primary font-body">{getTreeStageName(stats.tree_stage)}</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
