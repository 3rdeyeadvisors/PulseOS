import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Film, Music, BookOpen, Utensils, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Pick {
  type: 'movie' | 'music' | 'book' | 'food';
  title: string;
  subtitle: string;
  url?: string;
}

const picksByInterest: Record<string, Pick[]> = {
  movies: [
    { type: 'movie', title: 'Inception', subtitle: 'Sci-Fi Thriller', url: 'https://www.themoviedb.org/movie/27205' },
    { type: 'movie', title: 'The Grand Budapest Hotel', subtitle: 'Comedy Drama', url: 'https://www.themoviedb.org/movie/120467' },
  ],
  music: [
    { type: 'music', title: 'Chill Vibes', subtitle: 'Lo-fi Playlist', url: 'https://open.spotify.com/playlist/37i9dQZF1DX889U0CL85jj' },
    { type: 'music', title: 'Focus Flow', subtitle: 'Instrumental', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
  ],
  reading: [
    { type: 'book', title: 'Atomic Habits', subtitle: 'Self Improvement', url: 'https://www.goodreads.com/book/show/40121378-atomic-habits' },
    { type: 'book', title: 'Project Hail Mary', subtitle: 'Sci-Fi Novel', url: 'https://www.goodreads.com/book/show/54493401-project-hail-mary' },
  ],
  cooking: [
    { type: 'food', title: 'Mediterranean Bowl', subtitle: 'Healthy & Quick', url: 'https://www.google.com/search?q=mediterranean+bowl+recipe' },
    { type: 'food', title: 'Pasta Primavera', subtitle: '30 min recipe', url: 'https://www.google.com/search?q=pasta+primavera+recipe' },
  ],
};

const defaultPicks: Pick[] = [
  { type: 'movie', title: 'The Shawshank Redemption', subtitle: 'Classic Drama', url: 'https://www.themoviedb.org/movie/278' },
  { type: 'music', title: 'Today\'s Top Hits', subtitle: 'Popular Playlist', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' },
  { type: 'book', title: 'The Alchemist', subtitle: 'Fiction', url: 'https://www.goodreads.com/book/show/18144590-the-alchemist' },
  { type: 'food', title: 'Buddha Bowl', subtitle: 'Easy & Nutritious', url: 'https://www.google.com/search?q=buddha+bowl+recipe' },
];

const iconMap = {
  movie: Film,
  music: Music,
  book: BookOpen,
  food: Utensils,
};

const colorMap = {
  movie: 'text-red-400 bg-red-400/10',
  music: 'text-green-400 bg-green-400/10',
  book: 'text-blue-400 bg-blue-400/10',
  food: 'text-orange-400 bg-orange-400/10',
};

export function DailyPicksCard() {
  const { user } = useAuth();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPicks() {
      if (!user) return;

      const { data } = await supabase
        .from('preferences')
        .select('interests')
        .eq('user_id', user.id)
        .single();

      const interests = data?.interests as string[] || [];
      
      // Generate picks based on user interests - ensure uniqueness by type
      const userPicks: Pick[] = [];
      const usedTypes = new Set<string>();
      const usedTitles = new Set<string>();
      
      for (const interest of interests) {
        const interestPicks = picksByInterest[interest.toLowerCase()];
        if (interestPicks) {
          for (const pick of interestPicks) {
            // Only add if we don't already have this type or title
            if (!usedTypes.has(pick.type) && !usedTitles.has(pick.title)) {
              userPicks.push(pick);
              usedTypes.add(pick.type);
              usedTitles.add(pick.title);
              break; // Only one per interest
            }
          }
        }
      }

      // Fill with defaults if not enough picks (ensuring no duplicates)
      for (const defaultPick of defaultPicks) {
        if (userPicks.length >= 4) break;
        if (!usedTypes.has(defaultPick.type) && !usedTitles.has(defaultPick.title)) {
          userPicks.push(defaultPick);
          usedTypes.add(defaultPick.type);
          usedTitles.add(defaultPick.title);
        }
      }

      setPicks(userPicks.slice(0, 4));
      setLoading(false);
    }

    fetchPicks();
  }, [user]);

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Daily Picks for You</h3>
      <div className="space-y-3">
        {picks.map((pick) => {
          const Icon = iconMap[pick.type];
          const colors = colorMap[pick.type];
          // Create unique key from type + title
          const uniqueKey = `${pick.type}-${pick.title.replace(/\s+/g, '-').toLowerCase()}`;
          const handleClick = () => {
            if (pick.url) {
              window.open(pick.url, '_blank', 'noopener,noreferrer');
            }
          };
          
          return (
            <div 
              key={uniqueKey} 
              onClick={handleClick}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer group"
            >
              <div className={`p-2.5 rounded-lg ${colors}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{pick.title}</p>
                <p className="text-xs text-muted-foreground truncate">{pick.subtitle}</p>
              </div>
              {pick.url && (
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
