import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        // Handle signed out
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          navigate('/');
          return;
        }

        // For all other events, just update the session and user state
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check subscription status with Stripe (async, don't block)
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setTimeout(async () => {
            try {
              console.log('Checking Stripe subscription status...');
              await supabase.functions.invoke('check-subscription');
              console.log('Subscription status updated');
            } catch (error) {
              console.error('Error checking subscription:', error);
            }
          }, 0);
        }
      }
    );

    // Check for existing session and validate token on initial load
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setSession(null);
        setUser(null);
        setLoading(false);
        // Only redirect if on a protected page
        const publicPaths = ['/', '/auth', '/reset-password'];
        if (!publicPaths.includes(window.location.pathname)) {
          navigate('/');
        }
        return;
      }

      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt - now < fiveMinutes) {
        console.log('Token expiring soon, refreshing...');
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !data.session) {
          console.error('Failed to refresh token:', refreshError);
          setSession(null);
          setUser(null);
          navigate('/');
          return;
        }
        setSession(data.session);
        setUser(data.session.user);
      } else {
        setSession(session);
        setUser(session.user);
      }
      
      setLoading(false);
    };

    checkSession();

    // Check token validity every minute
    const interval = setInterval(checkSession, 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
