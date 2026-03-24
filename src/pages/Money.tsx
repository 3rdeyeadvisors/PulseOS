import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2, Fuel, TrendingDown, TrendingUp, Lightbulb, DollarSign, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getGasPrices, type GasStation } from '@/services/gasService';
import { getCostInsightsWithBudget, type CostInsight, type BudgetSuggestion } from '@/services/costOfLivingService';

interface UserProfile {
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  household_type?: string | null;
}

export default function Money() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [gasStations, setGasStations] = useState<GasStation[]>([]);
  const [costInsights, setCostInsights] = useState<CostInsight[]>([]);
  const [budgetTips, setBudgetTips] = useState<BudgetSuggestion[]>([]);
  const [gasLoading, setGasLoading] = useState(true);
  const [costLoading, setCostLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<CostInsight | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch profile data first
    const fetchProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('city, state, zip_code, household_type')
        .eq('user_id', user.id)
        .maybeSingle();
      return profile;
    };

    // Start cost insights fetch immediately with profile data (doesn't need coords)
    const fetchCostData = async (profile: UserProfile | null) => {
      try {
        const city = profile?.city || 'New York';
        const state = profile?.state;
        const householdType = profile?.household_type;
        const costData = await getCostInsightsWithBudget(city, state, householdType);
        setCostInsights(costData.insights);
        setBudgetTips(costData.budgetTips);
      } catch (err) {
        console.error('Cost data error:', err);
      } finally {
        setCostLoading(false);
      }
    };

    // Fetch gas prices with location (needs coords)
    const fetchGasData = async (profile: UserProfile | null) => {
      try {
        const city = profile?.city || 'New York';
        const state = profile?.state;
        let lat: number | null = null;
        let lng: number | null = null;

        // Try geolocation with short timeout, or use zip/city in parallel
        const geoPromise = new Promise<{lat: number, lng: number} | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 2000, maximumAge: 300000 }
          );
        });

        const zipPromise = profile?.zip_code 
          ? supabase.functions.invoke('geocode', { body: { zipCode: profile.zip_code, state: profile.state } })
            .then(({ data }) => data?.latitude ? { lat: data.latitude, lng: data.longitude } : null)
            .catch(() => null)
          : Promise.resolve(null);

        // Race: use whichever returns valid coords first
        const [geoResult, zipResult] = await Promise.all([geoPromise, zipPromise]);
        
        if (geoResult) {
          lat = geoResult.lat;
          lng = geoResult.lng;
        } else if (zipResult) {
          lat = zipResult.lat;
          lng = zipResult.lng;
        } else {
          // Fallback to city geocode
          try {
            const { data: geoData } = await supabase.functions.invoke('geocode', { body: { city, state } });
            if (geoData?.latitude) {
              lat = geoData.latitude;
              lng = geoData.longitude;
            }
          } catch {
            // intentional: city geocode fallback, ignore errors
          }
        }

        // Default fallback
        if (!lat || !lng) {
          lat = 40.7128;
          lng = -74.0060;
        }

        const gasResult = await getGasPrices(lat, lng, city, state);
        setGasStations(gasResult.stations);
      } catch (err) {
        console.error('Gas data error:', err);
      } finally {
        setGasLoading(false);
      }
    };

    // Execute: fetch profile, then start both data fetches in parallel
    fetchProfile().then((profile) => {
      fetchCostData(profile);
      fetchGasData(profile);
    });
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
          
          {gasLoading ? (
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
          
          {costLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
              {costInsights.map((insight) => (
                <button
                  key={insight.category}
                  onClick={() => setSelectedInsight(insight)}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{insight.category}</span>
                    {getTrendIcon(insight.trend)}
                  </div>
                  <p className="text-lg font-bold">${insight.averageCost}/mo</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{insight.tip}</p>
                </button>
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
          
          {costLoading ? (
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

        {/* Cost Insight Detail Dialog */}
        <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {selectedInsight?.category}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly Average</span>
                <span className="text-2xl font-bold">${selectedInsight?.averageCost}/mo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Trend:</span>
                <span className="flex items-center gap-1 capitalize">
                  {getTrendIcon(selectedInsight?.trend)}
                  {selectedInsight?.trend}
                </span>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-sm font-medium mb-1">Money-Saving Tip</p>
                <p className="text-sm text-muted-foreground">{selectedInsight?.tip}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
