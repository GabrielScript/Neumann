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
      className={`
        ${isCollapsed ? 'w-16' : 'w-56 lg:w-60'}
        transition-all duration-300 
        border-r-2 border-primary/20
      `}
      collapsible="icon"
      role="navigation"
      aria-label="Menu de navegação principal"
    >
      <SidebarContent className="p-3 lg:p-4">
        <div 
          className="mb-6 lg:mb-8 px-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/onboarding')}
          role="button"
          aria-label="Rever apresentação do Neumann"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/onboarding')}
        >
          <div className="flex items-center gap-3">
            {!isCollapsed && (
              <>
                <img 
                  src={logo} 
                  alt="Logo do Neumann - Aplicativo de desenvolvimento pessoal" 
                  className="w-10 h-10"
                  role="img"
                />
                <span className="font-display font-black text-lg lg:text-xl text-foreground">
                  Neumann
                </span>
              </>
            )}
            {isCollapsed && (
              <img 
                src={logo} 
                alt="Neumann"
                className="w-10 h-10" 
              />
            )}
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : 'text-sm lg:text-base'}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={`space-y-1.5 lg:space-y-2 ${isCollapsed ? 'mx-0' : 'mx-2'}`}>
              <TooltipProvider>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton 
                            asChild
                            className={`
                              h-auto touch-target
                              ${isCollapsed ? 'py-2.5 px-0' : 'py-2.5 lg:py-3 px-3 lg:px-4'} 
                              rounded-xl
                              transition-all duration-200
                            `}
                          >
                            <button
                              onClick={() => handleNavClick(item.url)}
                              aria-current={isActive ? 'page' : undefined}
                              aria-label={item.title}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleNavClick(item.url);
                                }
                              }}
                              className={`
                                flex items-center w-full
                                ${isCollapsed ? 'justify-center' : 'gap-2.5 lg:gap-3'} 
                                ${isActive 
                                  ? 'bg-primary/20 text-primary font-bold border-l-4 border-primary' 
                                  : 'hover:bg-accent/10 hover:text-accent focus-ring'
                                }
                              `}
                            >
                              <item.icon 
                                className="h-6 w-6 lg:h-7 lg:w-7" 
                                aria-hidden="true" 
                              />
                              {!isCollapsed && (
                                <div className="flex items-center gap-2">
                                  <span className="text-base lg:text-lg font-medium font-body">
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