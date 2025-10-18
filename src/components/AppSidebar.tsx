import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
import { Target, Trophy, Award, Users, Settings, Sparkles, CreditCard, Medal, MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import logo from '@/assets/logo.png';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Award },
  { title: 'Desafios', url: '/challenges', icon: Target },
  { title: 'Objetivos', url: '/goals', icon: Sparkles },
  { title: 'Meus Troféus', url: '/trophy', icon: Trophy },
  { title: 'Comunidades', subtitle: 'Beta', url: '/community', icon: Users },
  { title: 'Rankings', url: '/rankings', icon: Medal },
  { title: 'Assinaturas', url: '/subscriptions', icon: CreditCard },
  { title: 'Configurações', url: '/settings', icon: Settings },
  { title: 'Feedbacks', url: '/feedback', icon: MessageSquare },
];

export const AppSidebar = () => {
  const { state, setOpenMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isCollapsed = state === 'collapsed';
  const navigate = useNavigate();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else if (!isCollapsed) {
      toggleSidebar();
    }
  };

  return (
    <Sidebar 
      className={`${isCollapsed ? 'w-[110px]' : 'w-72'} transition-all duration-300 border-r-2 border-primary/20`} 
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        <div 
          className="mb-8 px-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/onboarding')}
          title="Rever apresentação"
        >
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
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-medium font-body">
                                    {item.title}
                                  </span>
                                  {'subtitle' in item && (
                                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-semibold">
                                      {item.subtitle}
                                    </span>
                                  )}
                                </div>
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
