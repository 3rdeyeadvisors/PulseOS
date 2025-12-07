import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Fuel, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getGasPrices } from '@/services/gasService';

interface GasStation {
  id: string;
  name: string;
  address: string;
  distance: string;
  price: number;
  priceChange: 'up' | 'down' | 'same';
}

export function GasCard() {
  const { user } = useAuth();
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGas() {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('city, state')
          .eq('user_id', user.id)
          .maybeSingle();

        const data = await getGasPrices(profile?.city || 'New York', profile?.state || undefined);
        setStations(data.slice(0, 3));
      } catch (err) {
        console.error('Gas fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGas();
  }, [user]);

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />;
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const cheapest = stations[0];

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Fuel className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Cheapest Gas</h3>
      </div>

      {cheapest && (
        <div className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-500">${cheapest.price.toFixed(2)}/gal</p>
              <p className="text-sm font-medium">{cheapest.name}</p>
              <p className="text-xs text-muted-foreground">{cheapest.distance}</p>
            </div>
            {getTrendIcon(cheapest.priceChange)}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {stations.slice(1).map((station) => (
          <div key={station.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors">
            <div>
              <p className="text-sm font-medium">{station.name}</p>
              <p className="text-xs text-muted-foreground">{station.distance}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">${station.price.toFixed(2)}</span>
              {getTrendIcon(station.priceChange)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
