import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2, Newspaper, ExternalLink, Globe, MapPin, TrendingUp, Cpu } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const categories = [
  { id: 'all', label: 'All', icon: Newspaper },
  { id: 'global', label: 'Global', icon: Globe },
  { id: 'local', label: 'Local', icon: MapPin },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'tech', label: 'Tech & Science', icon: Cpu },
];

interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category?: string;
}

export default function Reality() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [dataLoading, setDataLoading] = useState(true);
  const [newsEnabled, setNewsEnabled] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchNews() {
      if (!user) return;

      setDataLoading(true);

      try {
        const { data: prefs } = await supabase
          .from('preferences')
          .select('interests, enabled_modules')
          .eq('user_id', user.id)
          .maybeSingle();

        const modules = (prefs?.enabled_modules as string[]) || [];
        if (!modules.includes('news')) {
          setNewsEnabled(false);
          setDataLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('city, country')
          .eq('user_id', user.id)
          .maybeSingle();

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-news`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              interests: prefs?.interests || [],
              country: profile?.country || 'US',
              city: profile?.city || '',
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setNews(data.articles || []);
        }
      } catch (err) {
        console.error('News fetch error:', err);
      } finally {
        setDataLoading(false);
      }
    }

    fetchNews();
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
          <h1 className="text-2xl font-bold">Reality</h1>
          <p className="text-muted-foreground">Clean, unbiased news</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="shrink-0"
            >
              <cat.icon className="h-4 w-4 mr-1" />
              {cat.label}
            </Button>
          ))}
        </div>

        {/* News List */}
        {!newsEnabled ? (
          <div className="p-8 rounded-xl bg-card border border-border/50 text-center">
            <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">News Disabled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You've disabled the news module in settings.
            </p>
            <Button variant="outline" onClick={() => navigate('/app/settings')}>
              Enable in Settings
            </Button>
          </div>
        ) : dataLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border border-border/50 text-center">
            <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No news available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.source} · {formatTime(item.publishedAt)}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
