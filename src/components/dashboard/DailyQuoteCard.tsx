import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Quote, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QuoteData {
  quote: string;
  author: string;
}

export function DailyQuoteCard() {
  const { user } = useAuth();
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuote = async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: prefs } = await supabase
        .from('preferences')
        .select('interests')
        .eq('user_id', user.id)
        .maybeSingle();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            interests: prefs?.interests || [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get quote');
      }

      const data = await response.json();
      setQuoteData(data);
    } catch (err) {
      console.error('Quote fetch error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to load quote');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [user]);

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Quote className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground">Daily Inspiration</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => fetchQuote(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {quoteData ? (
        <>
          <p className="text-sm italic leading-relaxed mb-2">"{quoteData.quote}"</p>
          <p className="text-xs text-muted-foreground">— {quoteData.author}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No quote available</p>
      )}
    </div>
  );
}
