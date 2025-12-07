import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  const [theme, setThemeState] = useState<ThemeName>('night');

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('pulse-theme') as ThemeName | null;
    if (savedTheme && themes.some(t => t.name === savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Remove all theme classes from both html and body
    const root = document.documentElement;
    const body = document.body;
    
    themes.forEach(t => {
      root.classList.remove(`theme-${t.name}`);
      body.classList.remove(`theme-${t.name}`);
    });
    
    // Add current theme class to both html and body
    if (theme !== 'night') {
      root.classList.add(`theme-${theme}`);
      body.classList.add(`theme-${theme}`);
    }
    
    // Also set data attribute for additional CSS targeting
    root.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem('pulse-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
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
