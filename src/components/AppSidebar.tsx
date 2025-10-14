import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Target, Trophy, Award, Users, Settings, Sparkles } from 'lucide-react';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Trophy },
  { title: 'Desafios', url: '/challenges', icon: Target },
  { title: 'Objetivos de Vida', url: '/goals', icon: Sparkles },
  { title: 'Meu Troféu', url: '/trophy', icon: Award },
  { title: 'Comunidade', url: '/community', icon: Users },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar 
      className={`${isCollapsed ? 'w-20' : 'w-72'} transition-all duration-300 border-r-2 border-primary/20`} 
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            {!isCollapsed && (
              <>
                <Trophy className="w-10 h-10 text-primary" />
                <span className="font-display font-black text-xl text-primary">
                  Neumann
                </span>
              </>
            )}
            {isCollapsed && <Trophy className="w-10 h-10 text-primary" />}
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : 'text-base'}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 mx-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className="h-auto py-3 px-4 rounded-xl"
                    >
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 ${
                          isActive 
                            ? 'bg-primary/20 text-primary font-bold border-l-4 border-primary' 
                            : 'hover:bg-accent/10 hover:text-accent'
                        }`}
                      >
                        <item.icon className="h-7 w-7" />
                        {!isCollapsed && (
                          <span className="text-lg font-medium font-body">
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
