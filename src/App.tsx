import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingFallback } from "@/components/LoadingFallback";

// Páginas leves carregadas diretamente
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

// Lazy loading de páginas pesadas
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Goals = lazy(() => import("./pages/Goals"));
const Trophy = lazy(() => import("./pages/Trophy"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Community = lazy(() => import("./pages/Community"));
const Rankings = lazy(() => import("./pages/Rankings"));
const Settings = lazy(() => import("./pages/Settings"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Achievements = lazy(() => import("./pages/Achievements"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/trophy" element={<Trophy />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/community" element={<Community />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/achievements" element={<Achievements />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
