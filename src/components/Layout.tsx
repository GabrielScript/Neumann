import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TopBar } from '@/components/TopBar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full min-w-0">
          <TopBar />
          <main 
            className="flex-1 container-responsive py-4 md:py-6 lg:py-8 pl-4 md:pl-6 lg:pl-8"
            role="main"
            aria-label="Conteúdo principal"
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
