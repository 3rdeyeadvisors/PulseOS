import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Film, Music, BookOpen, Utensils } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Pick {
  type: 'movie' | 'music' | 'book' | 'food';
  title: string;
  subtitle: string;
}

const picksByInterest: Record<string, Pick[]> = {
  movies: [
    { type: 'movie', title: 'Inception', subtitle: 'Sci-Fi Thriller' },
    { type: 'movie', title: 'The Grand Budapest Hotel', subtitle: 'Comedy Drama' },
  ],
  music: [
    { type: 'music', title: 'Chill Vibes', subtitle: 'Lo-fi Playlist' },
    { type: 'music', title: 'Focus Flow', subtitle: 'Instrumental' },
  ],
  reading: [
    { type: 'book', title: 'Atomic Habits', subtitle: 'Self Improvement' },
    { type: 'book', title: 'Project Hail Mary', subtitle: 'Sci-Fi Novel' },
  ],
  cooking: [
    { type: 'food', title: 'Mediterranean Bowl', subtitle: 'Healthy & Quick' },
    { type: 'food', title: 'Pasta Primavera', subtitle: '30 min recipe' },
  ],
};

const defaultPicks: Pick[] = [
  { type: 'movie', title: 'The Shawshank Redemption', subtitle: 'Classic Drama' },
  { type: 'music', title: 'Today\'s Top Hits', subtitle: 'Popular Playlist' },
  { type: 'book', title: 'The Alchemist', subtitle: 'Fiction' },
  { type: 'food', title: 'Buddha Bowl', subtitle: 'Easy & Nutritious' },
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
      
      // Generate picks based on user interests
      const userPicks: Pick[] = [];
      interests.forEach((interest) => {
        const interestPicks = picksByInterest[interest.toLowerCase()];
        if (interestPicks) {
          userPicks.push(interestPicks[Math.floor(Math.random() * interestPicks.length)]);
        }
      });

      // Fill with defaults if not enough picks
      if (userPicks.length < 3) {
        const remaining = defaultPicks.filter(
          (p) => !userPicks.some((up) => up.type === p.type)
        );
        userPicks.push(...remaining.slice(0, 4 - userPicks.length));
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
        {picks.map((pick, index) => {
          const Icon = iconMap[pick.type];
          const colors = colorMap[pick.type];
          return (
            <div 
              key={index} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              <div className={`p-2.5 rounded-lg ${colors}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{pick.title}</p>
                <p className="text-xs text-muted-foreground">{pick.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
