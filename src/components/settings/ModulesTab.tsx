import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Sun, Newspaper, Utensils, Sparkles, Film, Cloud, TrendingUp, Flame } from 'lucide-react';

import { Fuel, CheckSquare, Music, Mic, Clapperboard } from 'lucide-react';

const modules = [
  { id: 'greeting', label: 'Greeting Card', description: 'Personalized welcome message', icon: Sun },
  { id: 'action-score', label: 'Daily Action Score', description: 'Track your daily engagement', icon: TrendingUp },
  { id: 'streak', label: 'Activity Streak', description: 'Track consecutive days of activity', icon: Flame },
  { id: 'weather', label: 'Weather', description: 'Local weather forecast', icon: Cloud },
  { id: 'gas', label: 'Gas Prices', description: 'Nearby fuel prices', icon: Fuel },
  { id: 'tasks', label: 'Tasks', description: 'Your to-do list', icon: CheckSquare },
  { id: 'ai-insight', label: 'AI Insight', description: 'Daily tip from your AI assistant', icon: Sparkles },
  { id: 'food', label: 'Food Recommendations', description: 'Meal ideas based on your diet', icon: Utensils },
  { id: 'song', label: 'Song of the Day', description: 'Daily music pick', icon: Music },
  { id: 'podcast', label: 'Podcast of the Day', description: 'Daily podcast pick', icon: Mic },
  { id: 'movie', label: 'Movie of the Day', description: 'Daily movie pick', icon: Clapperboard },
  { id: 'daily-picks', label: 'Daily Picks', description: 'Entertainment recommendations', icon: Film },
  { id: 'news', label: 'News', description: 'Curated headlines', icon: Newspaper },
];

export function ModulesTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPreferences() {
      if (!user) return;

      const { data } = await supabase
        .from('preferences')
        .select('enabled_modules')
        .eq('user_id', user.id)
        .single();

      if (data?.enabled_modules) {
        setEnabledModules(data.enabled_modules);
      } else {
        // Default all enabled
        setEnabledModules(modules.map((m) => m.id));
      }
      setLoading(false);
    }

    fetchPreferences();
  }, [user]);

  const toggleModule = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    const wasEnabled = enabledModules.includes(moduleId);
    
    setEnabledModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
    
    // Show immediate feedback about the change
    if (wasEnabled) {
      toast.info(`${module?.label || moduleId} will be hidden. Click Save to apply.`);
    } else {
      toast.info(`${module?.label || moduleId} will be shown. Click Save to apply.`);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('preferences')
      .update({ enabled_modules: enabledModules })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to save module settings');
    } else {
      toast.success('Module settings saved');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Modules</CardTitle>
        <CardDescription>Choose which cards appear on your Today dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {modules.map((module) => {
            const Icon = module.icon;
            const isEnabled = enabledModules.includes(module.id);
            return (
              <div
                key={module.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{module.label}</p>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleModule(module.id)}
                />
              </div>
            );
          })}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
