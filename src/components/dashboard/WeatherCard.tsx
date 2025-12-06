import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Cloud, Sun, CloudRain, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
}

export function WeatherCard() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string>('');

  useEffect(() => {
    async function fetchCityAndWeather() {
      if (!user) return;

      // Get user's city from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('city')
        .eq('user_id', user.id)
        .single();

      const userCity = profile?.city || 'New York';
      setCity(userCity);

      // Simulate weather data (in production, use a real weather API)
      // This is a placeholder until weather API is integrated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setWeather({
        temp: Math.floor(Math.random() * 20) + 60, // 60-80°F
        condition: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
        location: userCity,
      });
      
      setLoading(false);
    }

    fetchCityAndWeather();
  }, [user]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny':
        return <Sun className="h-10 w-10 text-yellow-400" />;
      case 'Cloudy':
        return <Cloud className="h-10 w-10 text-muted-foreground" />;
      case 'Rainy':
        return <CloudRain className="h-10 w-10 text-blue-400" />;
      default:
        return <Cloud className="h-10 w-10 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <Skeleton className="h-4 w-20 mb-3" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Weather</h3>
      <div className="flex items-center gap-4">
        {weather && getWeatherIcon(weather.condition)}
        <div>
          <p className="text-3xl font-bold">{weather?.temp}°F</p>
          <p className="text-sm text-muted-foreground">
            {weather?.condition} in {weather?.location}
          </p>
        </div>
      </div>
    </div>
  );
}
