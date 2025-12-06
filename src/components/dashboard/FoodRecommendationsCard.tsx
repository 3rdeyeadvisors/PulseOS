import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Utensils, Coffee, Sun, Moon, RefreshCw, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FoodRecommendation {
  name: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  isRestaurant?: boolean;
}

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Utensils,
};

const mealColors = {
  breakfast: 'text-amber-400 bg-amber-400/10',
  lunch: 'text-orange-400 bg-orange-400/10',
  dinner: 'text-indigo-400 bg-indigo-400/10',
  snack: 'text-green-400 bg-green-400/10',
};

export function FoodRecommendationsCard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<FoodRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Get user preferences
      const [{ data: prefs }, { data: profile }] = await Promise.all([
        supabase
          .from('preferences')
          .select('dietary_preferences')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('city')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/food-recommendations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            dietaryPreferences: prefs?.dietary_preferences || [],
            city: profile?.city || '',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Food recommendations error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Food Ideas</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => fetchRecommendations(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recommendations available</p>
        ) : (
          recommendations.map((rec, index) => {
            const Icon = rec.isRestaurant ? MapPin : (mealIcons[rec.mealType] || Utensils);
            const colors = rec.isRestaurant 
              ? 'text-rose-400 bg-rose-400/10' 
              : (mealColors[rec.mealType] || 'text-muted-foreground bg-muted');
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <div className={`p-2.5 rounded-lg ${colors}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm truncate">{rec.name}</p>
                    {rec.isRestaurant && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 shrink-0">Nearby</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{rec.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
