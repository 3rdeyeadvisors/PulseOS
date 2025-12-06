import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const themeColors: Record<ThemeName, { bg: string; primary: string; accent: string }> = {
  night: { bg: 'bg-[hsl(222,47%,6%)]', primary: 'bg-[hsl(217,91%,60%)]', accent: 'bg-[hsl(280,100%,70%)]' },
  minimal: { bg: 'bg-[hsl(0,0%,100%)]', primary: 'bg-[hsl(222,47%,11%)]', accent: 'bg-[hsl(220,14%,92%)]' },
  rose: { bg: 'bg-[hsl(350,20%,6%)]', primary: 'bg-[hsl(350,89%,60%)]', accent: 'bg-[hsl(320,90%,65%)]' },
  gold: { bg: 'bg-[hsl(35,30%,6%)]', primary: 'bg-[hsl(45,93%,47%)]', accent: 'bg-[hsl(25,95%,53%)]' },
  violet: { bg: 'bg-[hsl(270,40%,6%)]', primary: 'bg-[hsl(270,91%,65%)]', accent: 'bg-[hsl(300,90%,60%)]' },
  emerald: { bg: 'bg-[hsl(160,40%,5%)]', primary: 'bg-[hsl(160,84%,39%)]', accent: 'bg-[hsl(180,90%,45%)]' },
  sunset: { bg: 'bg-[hsl(15,40%,6%)]', primary: 'bg-[hsl(15,90%,55%)]', accent: 'bg-[hsl(35,95%,55%)]' },
  adaptive: { bg: 'bg-[hsl(220,20%,10%)]', primary: 'bg-[hsl(210,70%,55%)]', accent: 'bg-[hsl(200,80%,50%)]' },
};

export function ThemesTab() {
  const { user } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(theme);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const handleThemeSelect = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
    setTheme(themeName); // Live preview
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('preferences')
      .update({ theme: selectedTheme })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to save theme');
    } else {
      toast.success('Theme saved');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Themes</CardTitle>
        <CardDescription>Choose a theme that matches your style. Preview changes instantly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {themes.map((t) => {
            const colors = themeColors[t.name];
            const isSelected = selectedTheme === t.name;
            return (
              <button
                key={t.name}
                onClick={() => handleThemeSelect(t.name)}
                className={cn(
                  'relative p-4 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {/* Theme preview */}
                <div className={cn('w-full h-12 rounded-lg mb-3 relative overflow-hidden', colors.bg)}>
                  <div className={cn('absolute bottom-1 left-1 w-4 h-4 rounded', colors.primary)} />
                  <div className={cn('absolute bottom-1 left-6 w-3 h-3 rounded', colors.accent)} />
                </div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Theme
        </Button>
      </CardContent>
    </Card>
  );
}
