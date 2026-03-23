import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
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
import { DailyActionScoreCard } from '@/components/dashboard/DailyActionScoreCard';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { ReceivedTaskInvites } from '@/components/dashboard/ReceivedTaskInvites';
import { Loader2 } from 'lucide-react';

const ALL_MODULES = ['greeting', 'action-score', 'streak', 'weather', 'gas', 'tasks', 'ai-insight', 'food', 'song', 'podcast', 'movie', 'daily-picks', 'news'];

export default function Today() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { preferences, loading: modulesLoading } = usePreferences();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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

  const isEnabled = (moduleId: string) => (preferences.enabled_modules ?? ALL_MODULES).includes(moduleId);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto overflow-x-hidden">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {isEnabled('greeting') && <GreetingCard />}
          {isEnabled('action-score') && <DailyActionScoreCard />}
          {isEnabled('streak') && <StreakCard />}
          <ReceivedTaskInvites />
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
