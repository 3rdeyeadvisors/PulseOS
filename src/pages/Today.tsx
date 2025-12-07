import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

export default function Today() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto overflow-x-hidden">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <GreetingCard />
          <WeatherCard />
          <GasCard />
          <TasksCard />
          <AIInsightCard />
          <FoodRecommendationsCard />
          <SongCard />
          <PodcastCard />
          <MovieCard />
          <DailyPicksCard />
          <NewsCard />
        </div>
      </div>
    </AppShell>
  );
}
