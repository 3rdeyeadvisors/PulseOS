import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Preferences {
  ai_name: string | null;
  ai_personality: string | null;
  ai_humor_level: number | null;
  ai_formality_level: number | null;
  theme: string | null;
  temperature_unit: string | null;
  enabled_modules: string[] | null;
  dietary_preferences: string[] | null;
  interests: string[] | null;
}

const defaultPreferences: Preferences = {
  ai_name: 'Pulse',
  ai_personality: 'balanced',
  ai_humor_level: 50,
  ai_formality_level: 50,
  theme: 'night',
  temperature_unit: 'fahrenheit',
  enabled_modules: ['greeting', 'weather', 'news', 'food', 'daily-picks'],
  dietary_preferences: [],
  interests: [],
};

interface PreferencesContextType {
  preferences: Preferences;
  loading: boolean;
  updatePreferences: (updates: Partial<Preferences>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(defaultPreferences);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching preferences:', error);
      } else if (data) {
        setPreferences({
          ai_name: data.ai_name ?? defaultPreferences.ai_name,
          ai_personality: data.ai_personality ?? defaultPreferences.ai_personality,
          ai_humor_level: data.ai_humor_level ?? defaultPreferences.ai_humor_level,
          ai_formality_level: data.ai_formality_level ?? defaultPreferences.ai_formality_level,
          theme: data.theme ?? defaultPreferences.theme,
          temperature_unit: data.temperature_unit ?? defaultPreferences.temperature_unit,
          enabled_modules: data.enabled_modules ?? defaultPreferences.enabled_modules,
          dietary_preferences: data.dietary_preferences ?? defaultPreferences.dietary_preferences,
          interests: data.interests ?? defaultPreferences.interests,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`preferences-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'preferences',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Preferences changed:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            setPreferences({
              ai_name: newData.ai_name ?? defaultPreferences.ai_name,
              ai_personality: newData.ai_personality ?? defaultPreferences.ai_personality,
              ai_humor_level: newData.ai_humor_level ?? defaultPreferences.ai_humor_level,
              ai_formality_level: newData.ai_formality_level ?? defaultPreferences.ai_formality_level,
              theme: newData.theme ?? defaultPreferences.theme,
              temperature_unit: newData.temperature_unit ?? defaultPreferences.temperature_unit,
              enabled_modules: newData.enabled_modules ?? defaultPreferences.enabled_modules,
              dietary_preferences: newData.dietary_preferences ?? defaultPreferences.dietary_preferences,
              interests: newData.interests ?? defaultPreferences.interests,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updatePreferences = async (updates: Partial<Preferences>) => {
    if (!user) return;

    // Optimistic update
    setPreferences((prev) => ({ ...prev, ...updates }));

    const { error } = await supabase
      .from('preferences')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating preferences:', error);
      // Revert on error
      fetchPreferences();
    }
  };

  const refreshPreferences = async () => {
    setLoading(true);
    await fetchPreferences();
  };

  return (
    <PreferencesContext.Provider value={{ preferences, loading, updatePreferences, refreshPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
