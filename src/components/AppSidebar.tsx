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
import { Target, Trophy, TreeDeciduous, Users, Settings, Sprout } from 'lucide-react';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Sprout },
  { title: 'Desafios', url: '/challenges', icon: Target },
  { title: 'Objetivos de Vida', url: '/goals', icon: Trophy },
  { title: 'Minha Árvore', url: '/tree', icon: TreeDeciduous },
  { title: 'Comunidade', url: '/community', icon: Users },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={`${isCollapsed ? 'w-14' : 'w-64'} transition-all duration-300`} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            {!isCollapsed && (
              <>
                <Sprout className="w-8 h-8 text-primary" />
                <span className="font-bold text-lg">Challenger Life</span>
              </>
            )}
            {isCollapsed && <Sprout className="w-8 h-8 text-primary" />}
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`${
                          isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.title}</span>}
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
