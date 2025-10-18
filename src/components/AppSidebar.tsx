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
  const { state, setOpenMobile, setOpen } = useSidebar();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isCollapsed = state === 'collapsed';
  const navigate = useNavigate();

  const handleNavClick = (url: string) => {
    if (isMobile) {
      setOpenMobile(false);
      setTimeout(() => navigate(url), 150);
    } else {
      // Desktop: força collapsed e persiste no cookie
      if (!isCollapsed) {
        setOpen(false);
      }
      // Navega imediatamente
      navigate(url);
    }
  };

  return (
    <Sidebar 
      className={`${isCollapsed ? 'w-16' : 'w-56'} transition-all duration-300 border-r-2 border-primary/20`}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        <div 
          className="mb-8 px-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/onboarding')}
        >
          <div className="flex items-center gap-3">
            {!isCollapsed && (
              <>
                <img src={logo} alt="Logo Neumann" className="w-10 h-10" />
                <span className="font-display font-black text-xl text-foreground">
                  Neumann
                </span>
              </>
            )}
            {isCollapsed && (
              <img src={logo} alt="Neumann" className="w-10 h-10" />
            )}
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              <TooltipProvider>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <button
                              onClick={() => handleNavClick(item.url)}
                              className={`
                                flex items-center w-full py-2.5 px-3 rounded-xl
                                ${isCollapsed ? 'justify-center' : 'gap-3'} 
                                ${isActive 
                                  ? 'bg-primary/20 text-primary font-bold' 
                                  : 'hover:bg-accent/10 hover:text-accent'
                                }
                              `}
                            >
                              <item.icon className="h-6 w-6" />
                              {!isCollapsed && (
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-medium">
                                    {item.title}
                                  </span>
                                  {'subtitle' in item && (
                                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-semibold">
                                      {item.subtitle}
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
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