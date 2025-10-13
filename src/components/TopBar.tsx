import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export const TopBar = () => {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <SidebarTrigger />
      
      <div className="flex items-center gap-2">
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
