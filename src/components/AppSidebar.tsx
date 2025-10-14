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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Trophy, Award, Users, Settings, Sparkles, CreditCard, BarChart3, MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import logo from '@/assets/logo.png';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Award },
  { title: 'Desafios', url: '/challenges', icon: Target },
  { title: 'Objetivos de Vida', url: '/goals', icon: Sparkles },
  { title: 'Meus Troféus', url: '/trophy', icon: Trophy },
  { title: 'Comunidade (Beta)', url: '/community', icon: Users },
  { title: 'Rankings', url: '/rankings', icon: BarChart3 },
  { title: 'Assinaturas', url: '/subscriptions', icon: CreditCard },
  { title: 'Configurações', url: '/settings', icon: Settings },
  { title: 'Feedback', url: '/feedback', icon: MessageSquare },
];

export const AppSidebar = () => {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isCollapsed = state === 'collapsed';

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar 
      className={`${isCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 border-r-2 border-primary/20`} 
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            {!isCollapsed && (
              <>
                <img src={logo} alt="Neumann Logo" className="w-10 h-10" />
                <span className="font-display font-black text-xl text-foreground">
                  Neumann
                </span>
              </>
            )}
            {isCollapsed && <img src={logo} alt="Neumann Logo" className="w-10 h-10" />}
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : 'text-base'}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={`space-y-2 ${isCollapsed ? 'mx-0' : 'mx-2'}`}>
              <TooltipProvider>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton 
                            asChild
                            className={`h-auto ${isCollapsed ? 'py-3 px-0' : 'py-3 px-4'} rounded-xl`}
                          >
                            <NavLink
                              to={item.url}
                              onClick={handleNavClick}
                              className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${
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
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
