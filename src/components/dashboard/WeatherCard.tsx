import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

type TempUnit = 'fahrenheit' | 'celsius';

export function WeatherCard() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tempUnit, setTempUnit] = useState<TempUnit>('fahrenheit');

  useEffect(() => {
    let isMounted = true;

    async function fetchWeatherAndPrefs() {
      if (!user) return;

      try {
        // Get user's city and temp unit preference
        const [{ data: profile }, { data: prefs }] = await Promise.all([
          supabase
            .from('profiles')
            .select('city')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('preferences')
            .select('temperature_unit')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        if (!isMounted) return;

        if (prefs?.temperature_unit) {
          setTempUnit(prefs.temperature_unit as TempUnit);
        }

        const userCity = profile?.city || 'New York';

        // Fetch real weather data
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-weather`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ city: userCity }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch weather');
        }

        const data = await response.json();
        if (isMounted) {
          setWeather(data);
          setError(null);
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load weather');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchWeatherAndPrefs();

    // Re-fetch when page becomes visible (e.g., returning from settings)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchWeatherAndPrefs();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const toggleUnit = async () => {
    const newUnit: TempUnit = tempUnit === 'fahrenheit' ? 'celsius' : 'fahrenheit';
    setTempUnit(newUnit);

    if (user) {
      await supabase
        .from('preferences')
        .update({ temperature_unit: newUnit })
        .eq('user_id', user.id);
    }
  };

  const convertTemp = (tempF: number): number => {
    if (tempUnit === 'celsius') {
      return Math.round((tempF - 32) * 5 / 9);
    }
    return tempF;
  };

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      return <CloudLightning className="h-10 w-10 text-yellow-400" />;
    }
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <CloudRain className="h-10 w-10 text-blue-400" />;
    }
    if (lowerCondition.includes('snow')) {
      return <CloudSnow className="h-10 w-10 text-blue-200" />;
    }
    if (lowerCondition.includes('cloud')) {
      return <Cloud className="h-10 w-10 text-muted-foreground" />;
    }
    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
      return <Sun className="h-10 w-10 text-yellow-400" />;
    }
    return <Cloud className="h-10 w-10 text-muted-foreground" />;
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

  if (error) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Weather</h3>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const unitSymbol = tempUnit === 'fahrenheit' ? 'F' : 'C';
  const displayTemp = weather ? convertTemp(weather.temp) : 0;

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Weather</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={toggleUnit}
        >
          °{unitSymbol}
        </Button>
      </div>
      <div className="flex items-center gap-4">
        {weather && getWeatherIcon(weather.condition)}
        <div>
          <p className="text-3xl font-bold">{displayTemp}°{unitSymbol}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {weather?.description} in {weather?.location}
          </p>
        </div>
      </div>
      {weather && (
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Droplets className="h-3 w-3" /> {weather.humidity}%
          </span>
          <span className="flex items-center gap-1">
            <Wind className="h-3 w-3" /> {weather.windSpeed} mph
          </span>
        </div>
      )}
    </div>
  );
}
