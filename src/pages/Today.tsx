import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { GreetingCard } from '@/components/dashboard/GreetingCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { GasCard } from '@/components/dashboard/GasCard';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { DailyPicksCard } from '@/components/dashboard/DailyPicksCard';
import { NewsCard } from '@/components/dashboard/NewsCard';
import { FoodRecommendationsCard } from '@/components/dashboard/FoodRecommendationsCard';
import { SongCard, PodcastCard, MovieCard } from '@/components/dashboard/MediaCards';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { Loader2 } from 'lucide-react';

const ALL_MODULES = ['greeting', 'weather', 'gas', 'tasks', 'ai-insight', 'food', 'song', 'podcast', 'movie', 'daily-picks', 'news'];

export default function Today() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [enabledModules, setEnabledModules] = useState<string[]>(ALL_MODULES);
  const [modulesLoading, setModulesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchEnabledModules() {
      if (!user) return;
      
      const { data } = await supabase
        .from('preferences')
        .select('enabled_modules')
        .eq('user_id', user.id)
        .single();

      if (data?.enabled_modules) {
        setEnabledModules(data.enabled_modules);
      }
      setModulesLoading(false);
    }

    if (user) {
      fetchEnabledModules();
    }
  }, [user]);

  if (loading || modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isEnabled = (moduleId: string) => enabledModules.includes(moduleId);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto overflow-x-hidden">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {isEnabled('greeting') && <GreetingCard />}
          {isEnabled('weather') && <WeatherCard />}
          {isEnabled('gas') && <GasCard />}
          {isEnabled('tasks') && <TasksCard />}
          {isEnabled('ai-insight') && <AIInsightCard />}
          {isEnabled('food') && <FoodRecommendationsCard />}
          {isEnabled('song') && <SongCard />}
          {isEnabled('podcast') && <PodcastCard />}
          {isEnabled('movie') && <MovieCard />}
          {isEnabled('daily-picks') && <DailyPicksCard />}
          {isEnabled('news') && <NewsCard />}
        </div>
      </div>
    </AppShell>
  );
}
