import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2, Fuel, TrendingDown, TrendingUp, Minus, Lightbulb, DollarSign, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getGasPrices } from '@/services/gasService';
import { getCostInsightsWithBudget } from '@/services/costOfLivingService';

export default function Money() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [gasStations, setGasStations] = useState<any[]>([]);
  const [costInsights, setCostInsights] = useState<any[]>([]);
  const [budgetTips, setBudgetTips] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('city, state, zip_code, household_type')
          .eq('user_id', user.id)
          .maybeSingle();

        let lat: number | null = null;
        let lng: number | null = null;
        const city = profile?.city || 'New York';
        const state = profile?.state;
        const householdType = profile?.household_type;

        // Priority 1: Try browser geolocation
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (geoErr) {
          console.log('Browser geolocation not available');
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
            }
          } catch (geoErr) {
            console.error('Geocode by zip error:', geoErr);
          }
        }

        // Priority 3: Use city/state from profile
        if (!lat && city && state) {
          try {
            const { data: geoData } = await supabase.functions.invoke('geocode', {
              body: { city, state }
            });
            if (geoData?.latitude && geoData?.longitude) {
              lat = geoData.latitude;
              lng = geoData.longitude;
            }
          } catch (geoErr) {
            console.error('Geocode by city error:', geoErr);
          }
        }

        // Default fallback
        if (!lat || !lng) {
          lat = 40.7128;
          lng = -74.0060;
        }

        // Fetch all data in parallel - single API call for cost insights + budget tips
        const [gasResult, costData] = await Promise.all([
          getGasPrices(lat, lng, city, state),
          getCostInsightsWithBudget(city, state, householdType),
        ]);

        setGasStations(gasResult.stations);
        setCostInsights(costData.insights);
        setBudgetTips(costData.budgetTips);
      } catch (err) {
        console.error('Money data error:', err);
      } finally {
        setDataLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      default: return null; // Hide icon for "same" to avoid confusion with price
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Money</h1>
          <p className="text-muted-foreground">Cost of living insights & savings</p>
        </div>

        {/* Gas Prices */}
        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Fuel className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Gas Prices Near You</h2>
          </div>
          
          {dataLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {gasStations.map((station, i) => (
                <div
                  key={station.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    i === 0 ? 'bg-green-500/10 border border-green-500/20' : 'hover:bg-secondary/30'
                  } transition-colors`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{station.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{station.address} · {station.distance}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className={`text-lg font-bold ${i === 0 ? 'text-green-500' : ''}`}>
                      ${station.price.toFixed(2)}
                    </span>
                    {getTrendIcon(station.priceChange)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cost Insights */}
        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Cost of Living Summary</h2>
          </div>
          <Alert variant="default" className="mb-4 bg-muted/50 border-muted">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-muted-foreground">
              These are AI-estimated averages based on location and household type. Figures reflect general cost trends and may not match exact local prices. Use as a guide, not precise data.
            </AlertDescription>
          </Alert>
          
          {dataLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
              {costInsights.map((insight) => (
                <div key={insight.category} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{insight.category}</span>
                    {getTrendIcon(insight.trend)}
                  </div>
                  <p className="text-lg font-bold">${insight.averageCost}/mo</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{insight.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Tips */}
        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">AI Budget Suggestions</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">AI-generated tips personalized for your area</p>
          
          {dataLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {budgetTips.map((tip, i) => (
                <div key={i} className="p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{tip.title}</span>
                    <span className="text-sm font-semibold text-green-500 shrink-0 ml-2">Save {tip.savings}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{tip.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
