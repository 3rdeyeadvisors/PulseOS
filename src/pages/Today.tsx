import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { GreetingCard } from '@/components/dashboard/GreetingCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { DailyPicksCard } from '@/components/dashboard/DailyPicksCard';
import { NewsCard } from '@/components/dashboard/NewsCard';
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
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Full-width greeting */}
          <GreetingCard />
          
          {/* Weather */}
          <WeatherCard />
          
          {/* Quick Actions */}
          <QuickActionsCard />
          
          {/* AI Insight */}
          <AIInsightCard />
          
          {/* Daily Picks */}
          <DailyPicksCard />
          
          {/* News */}
          <NewsCard />
        </div>
      </div>
    </AppShell>
  );
}
