import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { initializeRevenueCat, loginRevenueCat, logoutRevenueCat, isNativePlatform } from '@/services/revenueCatService';
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to send welcome email and create welcome notification
const sendWelcomeNotifications = async (userId: string, email: string, fullName?: string) => {
  try {
    // Send welcome email
    await supabase.functions.invoke('send-welcome-email', {
      body: { userId, email, fullName },
    });
    console.log('Welcome email sent successfully');

    // Create in-app welcome notification
    await supabase.functions.invoke('create-notification', {
      body: {
        userId,
        type: 'welcome',
        title: 'Welcome to PulseOS! 🎉',
        message: 'Your personal life dashboard is ready. Explore your settings to customize your experience.',
        data: { isNew: true },
      },
    });
    console.log('Welcome notification created successfully');
  } catch (error) {
    console.error('Error sending welcome notifications:', error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize RevenueCat on native platforms
    if (isNativePlatform()) {
      initializeRevenueCat();
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle RevenueCat user identity on native platforms
        if (isNativePlatform()) {
          if (event === 'SIGNED_IN' && session?.user) {
            loginRevenueCat(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            logoutRevenueCat();
          }
        }

        // Send welcome notifications on signup (SIGNED_IN event after signup)
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a new user by looking at created_at
          const createdAt = new Date(session.user.created_at);
          const now = new Date();
          const isNewUser = (now.getTime() - createdAt.getTime()) < 60000; // Within last minute

          if (isNewUser) {
            setTimeout(() => {
              sendWelcomeNotifications(
                session.user.id,
                session.user.email || '',
                session.user.user_metadata?.full_name
              );
            }, 0);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Login to RevenueCat if user already has session
      if (isNativePlatform() && session?.user) {
        loginRevenueCat(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    try {
      // First, try to get/refresh the current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('No valid session for delete account');
        return { error: new Error('Your session has expired. Please log out and log back in, then try again.') };
      }

      // Try to refresh the session to ensure we have a valid token
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        return { error: new Error('Your session has expired. Please log out and log back in, then try again.') };
      }

      const { data, error } = await supabase.functions.invoke('delete-account');
      
      if (error) {
        console.error('Delete account error:', error);
        // Check for auth errors specifically
        if (error.message?.includes('401') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
          return { error: new Error('Your session has expired. Please log out and log back in, then try again.') };
        }
        return { error: new Error(error.message || 'Failed to delete account') };
      }
      
      if (data?.error) {
        return { error: new Error(data.error) };
      }
      
      // Sign out after successful deletion
      await supabase.auth.signOut();
      
      return { error: null };
    } catch (err) {
      console.error('Unexpected delete account error:', err);
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
