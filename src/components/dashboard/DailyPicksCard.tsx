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

// Daily rotation using UTC date for consistency
function getDailyIndex(arrayLength: number): number {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return dayOfYear % arrayLength;
}

const picksByInterest: Record<string, Pick[]> = {
  movies: [
    { type: 'movie', title: 'Inception', subtitle: 'Sci-Fi Thriller', url: 'https://www.themoviedb.org/movie/27205' },
    { type: 'movie', title: 'The Grand Budapest Hotel', subtitle: 'Comedy Drama', url: 'https://www.themoviedb.org/movie/120467' },
    { type: 'movie', title: 'Interstellar', subtitle: 'Sci-Fi Drama', url: 'https://www.themoviedb.org/movie/157336' },
    { type: 'movie', title: 'Parasite', subtitle: 'Thriller', url: 'https://www.themoviedb.org/movie/496243' },
    { type: 'movie', title: 'The Dark Knight', subtitle: 'Action', url: 'https://www.themoviedb.org/movie/155' },
    { type: 'movie', title: 'Pulp Fiction', subtitle: 'Crime Drama', url: 'https://www.themoviedb.org/movie/680' },
    { type: 'movie', title: 'Spirited Away', subtitle: 'Animation', url: 'https://www.themoviedb.org/movie/129' },
  ],
  music: [
    { type: 'music', title: 'Chill Vibes', subtitle: 'Lo-fi Playlist', url: 'https://open.spotify.com/playlist/37i9dQZF1DX889U0CL85jj' },
    { type: 'music', title: 'Focus Flow', subtitle: 'Instrumental', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
    { type: 'music', title: 'Morning Motivation', subtitle: 'Upbeat Mix', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0vHZ8elq0UK' },
    { type: 'music', title: 'Jazz Vibes', subtitle: 'Smooth Jazz', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT' },
    { type: 'music', title: 'Acoustic Covers', subtitle: 'Relaxing', url: 'https://open.spotify.com/playlist/37i9dQZF1DWXmlLSKkfdAk' },
    { type: 'music', title: 'Deep House', subtitle: 'Electronic', url: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC' },
    { type: 'music', title: 'Classical Focus', subtitle: 'Orchestra', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWEJlAGA9gs0' },
  ],
  reading: [
    { type: 'book', title: 'Atomic Habits', subtitle: 'Self Improvement', url: 'https://www.goodreads.com/book/show/40121378-atomic-habits' },
    { type: 'book', title: 'Project Hail Mary', subtitle: 'Sci-Fi Novel', url: 'https://www.goodreads.com/book/show/54493401-project-hail-mary' },
    { type: 'book', title: 'The Psychology of Money', subtitle: 'Finance', url: 'https://www.goodreads.com/book/show/41881472-the-psychology-of-money' },
    { type: 'book', title: 'Sapiens', subtitle: 'History', url: 'https://www.goodreads.com/book/show/23692271-sapiens' },
    { type: 'book', title: 'Deep Work', subtitle: 'Productivity', url: 'https://www.goodreads.com/book/show/25744928-deep-work' },
    { type: 'book', title: 'The Midnight Library', subtitle: 'Fiction', url: 'https://www.goodreads.com/book/show/52578297-the-midnight-library' },
    { type: 'book', title: 'Thinking, Fast and Slow', subtitle: 'Psychology', url: 'https://www.goodreads.com/book/show/11468377-thinking-fast-and-slow' },
  ],
  cooking: [
    { type: 'food', title: 'Mediterranean Bowl', subtitle: 'Healthy & Quick', url: 'https://www.google.com/search?q=mediterranean+bowl+recipe' },
    { type: 'food', title: 'Pasta Primavera', subtitle: '30 min recipe', url: 'https://www.google.com/search?q=pasta+primavera+recipe' },
    { type: 'food', title: 'Thai Green Curry', subtitle: 'Flavorful', url: 'https://www.google.com/search?q=thai+green+curry+recipe' },
    { type: 'food', title: 'Shakshuka', subtitle: 'Breakfast idea', url: 'https://www.google.com/search?q=shakshuka+recipe' },
    { type: 'food', title: 'Chicken Stir Fry', subtitle: 'Quick dinner', url: 'https://www.google.com/search?q=chicken+stir+fry+recipe' },
    { type: 'food', title: 'Homemade Pizza', subtitle: 'Weekend fun', url: 'https://www.google.com/search?q=homemade+pizza+dough+recipe' },
    { type: 'food', title: 'Buddha Bowl', subtitle: 'Nutritious', url: 'https://www.google.com/search?q=buddha+bowl+recipe' },
  ],
  fitness: [
    { type: 'book', title: 'Bigger Leaner Stronger', subtitle: 'Fitness Guide', url: 'https://www.goodreads.com/book/show/25333145-bigger-leaner-stronger' },
    { type: 'music', title: 'Beast Mode', subtitle: 'Workout Mix', url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP' },
  ],
  tech: [
    { type: 'book', title: 'The Pragmatic Programmer', subtitle: 'Tech Classic', url: 'https://www.goodreads.com/book/show/4099.The_Pragmatic_Programmer' },
    { type: 'book', title: 'Clean Code', subtitle: 'Programming', url: 'https://www.goodreads.com/book/show/3735293-clean-code' },
  ],
  gaming: [
    { type: 'music', title: 'Gaming Beats', subtitle: 'Focus Music', url: 'https://open.spotify.com/playlist/37i9dQZF1DWTyiBJ6yEqeu' },
    { type: 'movie', title: 'Ready Player One', subtitle: 'Sci-Fi Adventure', url: 'https://www.themoviedb.org/movie/333339' },
  ],
  travel: [
    { type: 'book', title: 'Into the Wild', subtitle: 'Adventure', url: 'https://www.goodreads.com/book/show/9594.Into_the_Wild' },
    { type: 'movie', title: 'The Secret Life of Walter Mitty', subtitle: 'Adventure Drama', url: 'https://www.themoviedb.org/movie/116745' },
  ],
  art: [
    { type: 'movie', title: 'Loving Vincent', subtitle: 'Animated Art Film', url: 'https://www.themoviedb.org/movie/339877' },
    { type: 'book', title: 'The Story of Art', subtitle: 'Art History', url: 'https://www.goodreads.com/book/show/17440.The_Story_of_Art' },
  ],
  finance: [
    { type: 'book', title: 'Rich Dad Poor Dad', subtitle: 'Personal Finance', url: 'https://www.goodreads.com/book/show/69571.Rich_Dad_Poor_Dad' },
    { type: 'book', title: 'The Intelligent Investor', subtitle: 'Investing', url: 'https://www.goodreads.com/book/show/106835.The_Intelligent_Investor' },
  ],
  sports: [
    { type: 'movie', title: 'Creed', subtitle: 'Sports Drama', url: 'https://www.themoviedb.org/movie/312221' },
    { type: 'book', title: 'The Mamba Mentality', subtitle: 'Sports Mindset', url: 'https://www.goodreads.com/book/show/40230101-the-mamba-mentality' },
  ],
};

// Dietary-specific food picks - URLs will be dynamically updated with location
const getFoodByDiet = (diet: string, city: string): Pick[] => {
  const locationQuery = city ? `+near+${encodeURIComponent(city)}` : '';
  
  const foodOptions: Record<string, Pick[]> = {
    vegan: [
      { type: 'food', title: 'Vegan Restaurant', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/vegan+restaurant${locationQuery}` },
      { type: 'food', title: 'Plant-Based Cafe', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/plant+based+cafe${locationQuery}` },
    ],
    vegetarian: [
      { type: 'food', title: 'Vegetarian Restaurant', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/vegetarian+restaurant${locationQuery}` },
      { type: 'food', title: 'Healthy Eatery', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/healthy+restaurant${locationQuery}` },
    ],
    'gluten-free': [
      { type: 'food', title: 'Gluten-Free Dining', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/gluten+free+restaurant${locationQuery}` },
    ],
    'dairy-free': [
      { type: 'food', title: 'Dairy-Free Options', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/dairy+free+restaurant${locationQuery}` },
    ],
    keto: [
      { type: 'food', title: 'Keto-Friendly Spot', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/keto+friendly+restaurant${locationQuery}` },
    ],
    halal: [
      { type: 'food', title: 'Halal Restaurant', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/halal+restaurant${locationQuery}` },
    ],
    kosher: [
      { type: 'food', title: 'Kosher Restaurant', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/kosher+restaurant${locationQuery}` },
    ],
  };
  
  return foodOptions[diet] || [];
};

// Default food pick based on location
const getDefaultFoodPick = (city: string): Pick => {
  const locationQuery = city ? `+near+${encodeURIComponent(city)}` : '';
  return { 
    type: 'food', 
    title: 'Top-Rated Restaurant', 
    subtitle: `Near ${city || 'you'}`, 
    url: `https://www.google.com/maps/search/top+rated+restaurant${locationQuery}` 
  };
};

const getDefaultPicks = (city: string): Pick[] => [
  { type: 'movie', title: 'The Shawshank Redemption', subtitle: 'Classic Drama', url: 'https://www.themoviedb.org/movie/278' },
  { type: 'music', title: "Today's Top Hits", subtitle: 'Popular Playlist', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' },
  { type: 'book', title: 'The Alchemist', subtitle: 'Fiction', url: 'https://www.goodreads.com/book/show/18144590-the-alchemist' },
  getDefaultFoodPick(city),
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
    let isMounted = true;

    async function fetchPicks() {
      if (!user) return;

      // Fetch both preferences and profile (for location)
      const [{ data: prefsData }, { data: profileData }] = await Promise.all([
        supabase
          .from('preferences')
          .select('interests, dietary_preferences')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('profiles')
          .select('city, state')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (!isMounted) return;

      const rawInterests = prefsData?.interests as string[] || [];
      const rawDietary = prefsData?.dietary_preferences as string[] || [];
      const city = profileData?.city || '';
      
      // Normalize and filter out "none" values
      const interests = rawInterests.map(i => i.toLowerCase()).filter(i => i && i !== 'none');
      const dietary = rawDietary.map(d => d.toLowerCase()).filter(d => d && d !== 'none');
      
      const dailyIndex = getDailyIndex(7); // Rotate weekly
      
      // Generate picks based on user interests - ensure uniqueness by type
      const userPicks: Pick[] = [];
      const usedTypes = new Set<string>();
      
      // First, add dietary-specific food pick if user has dietary preferences (location-aware)
      if (dietary.length > 0) {
        for (const diet of dietary) {
          const dietPicks = getFoodByDiet(diet, city);
          if (dietPicks && dietPicks.length > 0 && !usedTypes.has('food')) {
            const pickIndex = dailyIndex % dietPicks.length;
            userPicks.push(dietPicks[pickIndex]);
            usedTypes.add('food');
            break;
          }
        }
      }
      
      // Then add picks based on interests
      for (const interest of interests) {
        const interestPicks = picksByInterest[interest];
        if (interestPicks && interestPicks.length > 0) {
          // Get the pick for today based on daily rotation
          const pickIndex = dailyIndex % interestPicks.length;
          const pick = interestPicks[pickIndex];
          
          if (!usedTypes.has(pick.type)) {
            userPicks.push(pick);
            usedTypes.add(pick.type);
          }
        }
      }

      // Fill with defaults if not enough picks (ensuring no duplicates) - location-aware
      const defaultPicks = getDefaultPicks(city);
      for (const defaultPick of defaultPicks) {
        if (userPicks.length >= 4) break;
        if (!usedTypes.has(defaultPick.type)) {
          userPicks.push(defaultPick);
          usedTypes.add(defaultPick.type);
        }
      }

      setPicks(userPicks.slice(0, 4));
      setLoading(false);
    }

    fetchPicks();

    // Re-fetch when page becomes visible (e.g., returning from settings)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPicks();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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