import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Fuel, TrendingDown, TrendingUp, Minus, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getGasPrices, GasStation } from '@/services/gasService';

export function GasCard() {
  const { user } = useAuth();
  const [stations, setStations] = useState<GasStation[]>([]);
  const [note, setNote] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGas() {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('city, state, zip_code')
          .eq('user_id', user.id)
          .maybeSingle();

        // Get coordinates from geocode function
        let lat = 29.4241; // Default San Antonio
        let lng = -98.4936;

        if (profile?.city && profile?.state) {
          try {
            const { data: geoData } = await supabase.functions.invoke('geocode', {
              body: { address: `${profile.city}, ${profile.state}` }
            });
            if (geoData?.lat && geoData?.lng) {
              lat = geoData.lat;
              lng = geoData.lng;
            }
          } catch (geoErr) {
            console.error('Geocode error:', geoErr);
          }
        }

        const result = await getGasPrices(lat, lng, profile?.city, profile?.state);
        setStations(result.stations.slice(0, 3));
        setNote("Prices are regional estimates");
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
      default: return null; // Hide icon for "same" to avoid confusion with price
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Cheapest Gas</h3>
        </div>
        {note && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>{note}</span>
          </div>
        )}
      </div>

      {cheapest && cheapest.price !== null && (
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
              {station.price !== null ? (
                <span className="text-sm font-semibold">${station.price.toFixed(2)}</span>
              ) : (
                <span className="text-sm text-muted-foreground">N/A</span>
              )}
              {getTrendIcon(station.priceChange)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
