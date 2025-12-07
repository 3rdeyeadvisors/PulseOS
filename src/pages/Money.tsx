import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2, Fuel, TrendingDown, TrendingUp, Minus, Lightbulb, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getGasPrices } from '@/services/gasService';
import { getCostInsights, getBudgetSuggestions } from '@/services/costOfLivingService';

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
          .select('city, state')
          .eq('user_id', user.id)
          .maybeSingle();

        const city = profile?.city || 'New York';
        const state = profile?.state;

        // Get coordinates for gas prices
        let lat = 40.7128; // Default NYC
        let lng = -74.0060;

        if (city && state) {
          try {
            const { data: geoData } = await supabase.functions.invoke('geocode', {
              body: { address: `${city}, ${state}` }
            });
            if (geoData?.lat && geoData?.lng) {
              lat = geoData.lat;
              lng = geoData.lng;
            }
          } catch (geoErr) {
            console.error('Geocode error:', geoErr);
          }
        }

        const [gasResult, insights, tips] = await Promise.all([
          getGasPrices(lat, lng, city, state),
          getCostInsights(city),
          getBudgetSuggestions(),
        ]);

        setGasStations(gasResult.stations);
        setCostInsights(insights);
        setBudgetTips(tips);
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
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {gasStations.map((station, i) => (
                <div
                  key={station.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    i === 0 ? 'bg-green-500/10 border border-green-500/20' : 'hover:bg-secondary/30'
                  } transition-colors`}
                >
                  <div>
                    <p className="font-medium">{station.name}</p>
                    <p className="text-sm text-muted-foreground">{station.address} · {station.distance}</p>
                  </div>
                  <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Cost of Living Summary</h2>
          </div>
          
          {dataLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {costInsights.map((insight) => (
                <div key={insight.category} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{insight.category}</span>
                    {getTrendIcon(insight.trend)}
                  </div>
                  <p className="text-lg font-bold">${insight.averageCost}/mo</p>
                  <p className="text-xs text-muted-foreground">{insight.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Tips */}
        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">AI Budget Suggestions</h2>
          </div>
          
          {dataLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {budgetTips.map((tip, i) => (
                <div key={i} className="p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{tip.title}</span>
                    <span className="text-sm font-semibold text-green-500">Save {tip.savings}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
