import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePreferences } from './PreferencesContext';

export type ThemeName = 
  | 'night' 
  | 'minimal' 
  | 'rose' 
  | 'gold' 
  | 'violet' 
  | 'emerald' 
  | 'sunset' 
  | 'adaptive';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: { name: ThemeName; label: string; description: string }[];
}

const themes: { name: ThemeName; label: string; description: string }[] = [
  { name: 'night', label: 'Night', description: 'Deep blues with electric accents' },
  { name: 'minimal', label: 'Minimal', description: 'Clean whites and elegant grays' },
  { name: 'rose', label: 'Rose', description: 'Warm pinks and soft tones' },
  { name: 'gold', label: 'Gold', description: 'Luxurious amber warmth' },
  { name: 'violet', label: 'Violet', description: 'Deep purples and magentas' },
  { name: 'emerald', label: 'Emerald', description: 'Rich greens and teals' },
  { name: 'sunset', label: 'Sunset', description: 'Warm oranges and coral' },
  { name: 'adaptive', label: 'Adaptive', description: 'Calm blue-grays for any time' },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { preferences, updatePreferences, loading } = usePreferences();
  const [theme, setThemeState] = useState<ThemeName>('night');

  // Sync theme from preferences
  useEffect(() => {
    if (!loading && preferences.theme) {
      const savedTheme = preferences.theme as ThemeName;
      if (themes.some(t => t.name === savedTheme)) {
        setThemeState(savedTheme);
      }
    }
  }, [preferences.theme, loading]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    
    themes.forEach(t => {
      root.classList.remove(`theme-${t.name}`);
    });
    
    if (theme !== 'night') {
      root.classList.add(`theme-${theme}`);
    }
    
    // Also save to localStorage for initial load before auth
    localStorage.setItem('pulse-theme', theme);
  }, [theme]);

  const setTheme = async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    // Update in Supabase via preferences context
    await updatePreferences({ theme: newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
