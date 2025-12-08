import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Fuel, TrendingDown, TrendingUp, Info, Navigation } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getGasPrices, GasStation } from '@/services/gasService';

const openInMaps = (address: string, name: string) => {
  const query = encodeURIComponent(`${name}, ${address}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.open(mapsUrl, '_blank');
};

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

        let lat: number | null = null;
        let lng: number | null = null;
        let locationSource = "default";

        // Priority 1: Try browser geolocation
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000 // Cache for 5 minutes
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
          locationSource = "current location";
        } catch (geoErr) {
          console.log('Browser geolocation not available, falling back to profile');
        }

        // Priority 2: Use zip code from profile
        if (!lat && profile?.zip_code) {
          try {
            const { data: geoData } = await supabase.functions.invoke('geocode', {
              body: { zipCode: profile.zip_code, state: profile.state }
            });
            if (geoData?.latitude && geoData?.longitude) {
              lat = geoData.latitude;
              lng = geoData.longitude;
              locationSource = "zip code";
            }
          } catch (geoErr) {
            console.error('Geocode by zip error:', geoErr);
          }
        }

        // Priority 3: Use city/state from profile
        if (!lat && profile?.city && profile?.state) {
          try {
            const { data: geoData } = await supabase.functions.invoke('geocode', {
              body: { city: profile.city, state: profile.state }
            });
            if (geoData?.latitude && geoData?.longitude) {
              lat = geoData.latitude;
              lng = geoData.longitude;
              locationSource = "city";
            }
          } catch (geoErr) {
            console.error('Geocode by city error:', geoErr);
          }
        }

        // Default fallback: San Antonio
        if (!lat || !lng) {
          lat = 29.4241;
          lng = -98.4936;
          locationSource = "default";
        }

        const result = await getGasPrices(lat, lng, profile?.city, profile?.state);
        setStations(result.stations.slice(0, 3));
        setNote(locationSource === "current location" ? "Based on current location" : "Prices are regional estimates");
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
        <button
          onClick={() => openInMaps(cheapest.address, cheapest.name)}
          className="w-full mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-500">${cheapest.price.toFixed(2)}/gal</p>
              <p className="text-sm font-medium">{cheapest.name}</p>
              <p className="text-xs text-muted-foreground">{cheapest.distance}</p>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(cheapest.priceChange)}
              <div className="p-1.5 rounded-lg bg-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Navigation className="h-3.5 w-3.5 text-green-500" />
              </div>
            </div>
          </div>
        </button>
      )}

      <div className="space-y-2">
        {stations.slice(1).map((station) => (
          <button
            key={station.id}
            onClick={() => openInMaps(station.address, station.name)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer group text-left"
          >
            <div>
              <p className="text-sm font-medium">{station.name}</p>
              <p className="text-xs text-muted-foreground">{station.distance}</p>
            </div>
            <div className="flex items-center gap-2">
              {station.price !== null ? (
                <span className="text-sm font-semibold">${station.price.toFixed(2)}</span>
              ) : (
                <span className="text-sm text-muted-foreground">N/A</span>
              )}
              {getTrendIcon(station.priceChange)}
              <div className="p-1 rounded bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Navigation className="h-3 w-3 text-primary" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}