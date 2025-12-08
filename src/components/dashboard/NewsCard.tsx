import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { US_CITY_STATE_MAP } from '@/data/usStates';

interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

interface CachedNews {
  articles: NewsItem[];
  cachedAt: number; // timestamp
  cacheKey: string; // to invalidate if location/interests change
}

const NEWS_CACHE_KEY = 'news_cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(city: string, state: string, interests: string[]): string {
  return `${city}-${state}-${interests.sort().join(',')}`;
}

export function NewsCard() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchNews = async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Get user interests, city, country and state
      const [{ data: prefs }, { data: profile }] = await Promise.all([
        supabase
          .from('preferences')
          .select('interests')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('country, city, state')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      // Determine state - use stored value or infer from city for US
      const city = profile?.city || '';
      const country = profile?.country || 'United States';
      const isUSA = country.toLowerCase().includes('united states') || country.toLowerCase() === 'usa';
      const state = profile?.state || (isUSA ? US_CITY_STATE_MAP[city] : undefined) || '';
      const interests = (prefs?.interests as string[]) || [];
      
      const currentCacheKey = getCacheKey(city, state, interests);

      // Check cache (unless refreshing)
      if (!isRefresh) {
        try {
          const cached = localStorage.getItem(NEWS_CACHE_KEY);
          if (cached) {
            const parsed: CachedNews = JSON.parse(cached);
            const now = Date.now();
            
            // Use cache if within duration and same context
            if (parsed.cacheKey === currentCacheKey && (now - parsed.cachedAt) < CACHE_DURATION_MS) {
              console.log('Using cached news');
              setNews(parsed.articles);
              setError(null);
              setLoading(false);
              setRefreshing(false);
              return;
            }
          }
        } catch {
          // Ignore cache errors
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-news`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            interests: interests,
            country: country,
            city: city,
            state: state,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch news');
      }

      const data = await response.json();
      const articles = data.articles || [];
      setNews(articles);
      setError(null);
      
      // Cache the results
      try {
        const cacheData: CachedNews = {
          articles,
          cachedAt: Date.now(),
          cacheKey: currentCacheKey,
        };
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cacheData));
      } catch {
        // Ignore cache errors
      }
    } catch (err) {
      console.error('News fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchNews();
    }
  }, [user]);

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Today's Headlines</h3>
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Today's Headlines</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => fetchNews(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <div className="space-y-3">
        {news.length === 0 ? (
          <p className="text-sm text-muted-foreground">No news available</p>
        ) : (
          news.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-3 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </p>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.source} · {formatTime(item.publishedAt)}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}