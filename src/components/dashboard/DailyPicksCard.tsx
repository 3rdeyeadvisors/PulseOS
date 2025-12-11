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

// Daily rotation using UTC date + user ID for personalized variety
function getDailyIndex(arrayLength: number, userId?: string): number {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Add user-specific offset so different users see different picks
  let userOffset = 0;
  if (userId) {
    // Simple hash of user ID
    for (let i = 0; i < userId.length; i++) {
      userOffset += userId.charCodeAt(i);
    }
  }
  
  return (dayOfYear + userOffset) % arrayLength;
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
    { type: 'movie', title: 'The Matrix', subtitle: 'Sci-Fi Action', url: 'https://www.themoviedb.org/movie/603' },
    { type: 'movie', title: 'Whiplash', subtitle: 'Drama', url: 'https://www.themoviedb.org/movie/244786' },
    { type: 'movie', title: 'Mad Max: Fury Road', subtitle: 'Action', url: 'https://www.themoviedb.org/movie/76341' },
    { type: 'movie', title: 'La La Land', subtitle: 'Musical Romance', url: 'https://www.themoviedb.org/movie/313369' },
    { type: 'movie', title: 'Get Out', subtitle: 'Horror Thriller', url: 'https://www.themoviedb.org/movie/419430' },
    { type: 'movie', title: 'Arrival', subtitle: 'Sci-Fi Drama', url: 'https://www.themoviedb.org/movie/329865' },
    { type: 'movie', title: 'The Social Network', subtitle: 'Biography Drama', url: 'https://www.themoviedb.org/movie/37799' },
    { type: 'movie', title: 'Blade Runner 2049', subtitle: 'Sci-Fi', url: 'https://www.themoviedb.org/movie/335984' },
    { type: 'movie', title: 'Knives Out', subtitle: 'Mystery Comedy', url: 'https://www.themoviedb.org/movie/546554' },
    { type: 'movie', title: 'Dune', subtitle: 'Sci-Fi Epic', url: 'https://www.themoviedb.org/movie/438631' },
    { type: 'movie', title: 'Everything Everywhere All at Once', subtitle: 'Sci-Fi Comedy', url: 'https://www.themoviedb.org/movie/545611' },
    { type: 'movie', title: 'The Shining', subtitle: 'Horror', url: 'https://www.themoviedb.org/movie/694' },
    { type: 'movie', title: 'Moonlight', subtitle: 'Drama', url: 'https://www.themoviedb.org/movie/376867' },
  ],
  music: [
    { type: 'music', title: 'Chill Vibes', subtitle: 'Lo-fi Playlist', url: 'https://open.spotify.com/playlist/37i9dQZF1DX889U0CL85jj' },
    { type: 'music', title: 'Focus Flow', subtitle: 'Instrumental', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
    { type: 'music', title: 'Morning Motivation', subtitle: 'Upbeat Mix', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0vHZ8elq0UK' },
    { type: 'music', title: 'Jazz Vibes', subtitle: 'Smooth Jazz', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT' },
    { type: 'music', title: 'Acoustic Covers', subtitle: 'Relaxing', url: 'https://open.spotify.com/playlist/37i9dQZF1DWXmlLSKkfdAk' },
    { type: 'music', title: 'Deep House', subtitle: 'Electronic', url: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC' },
    { type: 'music', title: 'Classical Focus', subtitle: 'Orchestra', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWEJlAGA9gs0' },
    { type: 'music', title: 'Indie Chill', subtitle: 'Alternative', url: 'https://open.spotify.com/playlist/37i9dQZF1DX2Nc3B70tvx0' },
    { type: 'music', title: 'Soft Pop Hits', subtitle: 'Easy Listening', url: 'https://open.spotify.com/playlist/37i9dQZF1DWTwnEm1IYyoj' },
    { type: 'music', title: 'Peaceful Piano', subtitle: 'Calm', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
    { type: 'music', title: 'All Out 2010s', subtitle: 'Throwbacks', url: 'https://open.spotify.com/playlist/37i9dQZF1DX5Ejj0EkURtP' },
    { type: 'music', title: 'Rock Classics', subtitle: 'Guitar Legends', url: 'https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U' },
    { type: 'music', title: 'RapCaviar', subtitle: 'Hip-Hop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd' },
    { type: 'music', title: 'Viva Latino', subtitle: 'Latin Hits', url: 'https://open.spotify.com/playlist/37i9dQZF1DX10zKzsJ2jva' },
    { type: 'music', title: 'Sleep', subtitle: 'Ambient', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp' },
  ],
  reading: [
    { type: 'book', title: 'Atomic Habits', subtitle: 'Self Improvement', url: 'https://www.goodreads.com/book/show/40121378-atomic-habits' },
    { type: 'book', title: 'Project Hail Mary', subtitle: 'Sci-Fi Novel', url: 'https://www.goodreads.com/book/show/54493401-project-hail-mary' },
    { type: 'book', title: 'The Psychology of Money', subtitle: 'Finance', url: 'https://www.goodreads.com/book/show/41881472-the-psychology-of-money' },
    { type: 'book', title: 'Sapiens', subtitle: 'History', url: 'https://www.goodreads.com/book/show/23692271-sapiens' },
    { type: 'book', title: 'Deep Work', subtitle: 'Productivity', url: 'https://www.goodreads.com/book/show/25744928-deep-work' },
    { type: 'book', title: 'The Midnight Library', subtitle: 'Fiction', url: 'https://www.goodreads.com/book/show/52578297-the-midnight-library' },
    { type: 'book', title: 'Thinking, Fast and Slow', subtitle: 'Psychology', url: 'https://www.goodreads.com/book/show/11468377-thinking-fast-and-slow' },
    { type: 'book', title: 'Educated', subtitle: 'Memoir', url: 'https://www.goodreads.com/book/show/35133922-educated' },
    { type: 'book', title: 'The 7 Habits of Highly Effective People', subtitle: 'Self-Help', url: 'https://www.goodreads.com/book/show/36072.The_7_Habits_of_Highly_Effective_People' },
    { type: 'book', title: 'Dune', subtitle: 'Sci-Fi Classic', url: 'https://www.goodreads.com/book/show/44767458-dune' },
    { type: 'book', title: 'The Power of Now', subtitle: 'Spirituality', url: 'https://www.goodreads.com/book/show/6708.The_Power_of_Now' },
    { type: 'book', title: 'A Brief History of Time', subtitle: 'Science', url: 'https://www.goodreads.com/book/show/3869.A_Brief_History_of_Time' },
    { type: 'book', title: 'The Subtle Art of Not Giving a F*ck', subtitle: 'Self-Help', url: 'https://www.goodreads.com/book/show/28257707-the-subtle-art-of-not-giving-a-f-ck' },
    { type: 'book', title: 'Where the Crawdads Sing', subtitle: 'Mystery Fiction', url: 'https://www.goodreads.com/book/show/36809135-where-the-crawdads-sing' },
    { type: 'book', title: 'Becoming', subtitle: 'Autobiography', url: 'https://www.goodreads.com/book/show/38746485-becoming' },
  ],
  cooking: [
    { type: 'book', title: 'Salt, Fat, Acid, Heat', subtitle: 'Cooking Mastery', url: 'https://www.goodreads.com/book/show/30753841-salt-fat-acid-heat' },
    { type: 'book', title: 'The Food Lab', subtitle: 'Science of Cooking', url: 'https://www.goodreads.com/book/show/24861842-the-food-lab' },
    { type: 'book', title: 'The Joy of Cooking', subtitle: 'Classic Recipes', url: 'https://www.goodreads.com/book/show/327847.The_Joy_of_Cooking' },
    { type: 'book', title: 'Mastering the Art of French Cooking', subtitle: 'Julia Child', url: 'https://www.goodreads.com/book/show/129650.Mastering_the_Art_of_French_Cooking' },
    { type: 'book', title: 'Kitchen Confidential', subtitle: 'Food Memoir', url: 'https://www.goodreads.com/book/show/33313.Kitchen_Confidential' },
  ],
  fitness: [
    { type: 'book', title: 'Bigger Leaner Stronger', subtitle: 'Fitness Guide', url: 'https://www.goodreads.com/book/show/25333145-bigger-leaner-stronger' },
    { type: 'music', title: 'Beast Mode', subtitle: 'Workout Mix', url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP' },
    { type: 'music', title: 'Power Workout', subtitle: 'High Energy', url: 'https://open.spotify.com/playlist/37i9dQZF1DWUVpAXiEPK8P' },
    { type: 'music', title: 'Cardio', subtitle: 'Running Beats', url: 'https://open.spotify.com/playlist/37i9dQZF1DWSJHnPb1f0X3' },
    { type: 'book', title: 'Can\'t Hurt Me', subtitle: 'David Goggins', url: 'https://www.goodreads.com/book/show/41721428-can-t-hurt-me' },
    { type: 'music', title: 'Motivation Mix', subtitle: 'Get Pumped', url: 'https://open.spotify.com/playlist/37i9dQZF1DX5gQonLbZD9s' },
  ],
  tech: [
    { type: 'book', title: 'The Pragmatic Programmer', subtitle: 'Tech Classic', url: 'https://www.goodreads.com/book/show/4099.The_Pragmatic_Programmer' },
    { type: 'book', title: 'Clean Code', subtitle: 'Programming', url: 'https://www.goodreads.com/book/show/3735293-clean-code' },
    { type: 'book', title: 'Designing Data-Intensive Applications', subtitle: 'Systems Design', url: 'https://www.goodreads.com/book/show/23463279-designing-data-intensive-applications' },
    { type: 'book', title: 'The Phoenix Project', subtitle: 'DevOps Novel', url: 'https://www.goodreads.com/book/show/17255186-the-phoenix-project' },
    { type: 'movie', title: 'The Social Network', subtitle: 'Tech Drama', url: 'https://www.themoviedb.org/movie/37799' },
    { type: 'movie', title: 'Ex Machina', subtitle: 'AI Thriller', url: 'https://www.themoviedb.org/movie/264660' },
    { type: 'movie', title: 'Her', subtitle: 'Sci-Fi Romance', url: 'https://www.themoviedb.org/movie/152601' },
  ],
  gaming: [
    { type: 'music', title: 'Gaming Beats', subtitle: 'Focus Music', url: 'https://open.spotify.com/playlist/37i9dQZF1DWTyiBJ6yEqeu' },
    { type: 'movie', title: 'Ready Player One', subtitle: 'Sci-Fi Adventure', url: 'https://www.themoviedb.org/movie/333339' },
    { type: 'movie', title: 'Free Guy', subtitle: 'Action Comedy', url: 'https://www.themoviedb.org/movie/550988' },
    { type: 'movie', title: 'Wreck-It Ralph', subtitle: 'Animation', url: 'https://www.themoviedb.org/movie/82690' },
    { type: 'music', title: 'Video Game Soundtracks', subtitle: 'Epic Scores', url: 'https://open.spotify.com/playlist/37i9dQZF1DXdfOcg1fm0VG' },
  ],
  travel: [
    { type: 'book', title: 'Into the Wild', subtitle: 'Adventure', url: 'https://www.goodreads.com/book/show/9594.Into_the_Wild' },
    { type: 'movie', title: 'The Secret Life of Walter Mitty', subtitle: 'Adventure Drama', url: 'https://www.themoviedb.org/movie/116745' },
    { type: 'movie', title: 'Up', subtitle: 'Animated Adventure', url: 'https://www.themoviedb.org/movie/14160' },
    { type: 'book', title: 'A Walk in the Woods', subtitle: 'Travel Memoir', url: 'https://www.goodreads.com/book/show/9791.A_Walk_in_the_Woods' },
    { type: 'movie', title: 'Lost in Translation', subtitle: 'Drama', url: 'https://www.themoviedb.org/movie/153' },
    { type: 'book', title: 'Eat Pray Love', subtitle: 'Travel Memoir', url: 'https://www.goodreads.com/book/show/19501.Eat_Pray_Love' },
  ],
  art: [
    { type: 'movie', title: 'Loving Vincent', subtitle: 'Animated Art Film', url: 'https://www.themoviedb.org/movie/339877' },
    { type: 'book', title: 'The Story of Art', subtitle: 'Art History', url: 'https://www.goodreads.com/book/show/17440.The_Story_of_Art' },
    { type: 'movie', title: 'Frida', subtitle: 'Biographical Drama', url: 'https://www.themoviedb.org/movie/7681' },
    { type: 'movie', title: 'Girl with a Pearl Earring', subtitle: 'Historical Drama', url: 'https://www.themoviedb.org/movie/2947' },
    { type: 'book', title: 'Ways of Seeing', subtitle: 'Art Criticism', url: 'https://www.goodreads.com/book/show/2784.Ways_of_Seeing' },
  ],
  finance: [
    { type: 'book', title: 'Rich Dad Poor Dad', subtitle: 'Personal Finance', url: 'https://www.goodreads.com/book/show/69571.Rich_Dad_Poor_Dad' },
    { type: 'book', title: 'The Intelligent Investor', subtitle: 'Investing', url: 'https://www.goodreads.com/book/show/106835.The_Intelligent_Investor' },
    { type: 'book', title: 'I Will Teach You to Be Rich', subtitle: 'Personal Finance', url: 'https://www.goodreads.com/book/show/40591670-i-will-teach-you-to-be-rich' },
    { type: 'movie', title: 'The Big Short', subtitle: 'Financial Drama', url: 'https://www.themoviedb.org/movie/318846' },
    { type: 'movie', title: 'Margin Call', subtitle: 'Thriller', url: 'https://www.themoviedb.org/movie/59985' },
    { type: 'book', title: 'Think and Grow Rich', subtitle: 'Classic', url: 'https://www.goodreads.com/book/show/1005.Think_and_Grow_Rich' },
  ],
  sports: [
    { type: 'movie', title: 'Creed', subtitle: 'Sports Drama', url: 'https://www.themoviedb.org/movie/312221' },
    { type: 'book', title: 'The Mamba Mentality', subtitle: 'Sports Mindset', url: 'https://www.goodreads.com/book/show/40230101-the-mamba-mentality' },
    { type: 'movie', title: 'Moneyball', subtitle: 'Sports Drama', url: 'https://www.themoviedb.org/movie/60308' },
    { type: 'movie', title: 'The Blind Side', subtitle: 'Biography', url: 'https://www.themoviedb.org/movie/22881' },
    { type: 'book', title: 'Open', subtitle: 'Andre Agassi', url: 'https://www.goodreads.com/book/show/6480781-open' },
    { type: 'movie', title: 'Rocky', subtitle: 'Sports Classic', url: 'https://www.themoviedb.org/movie/1366' },
  ],
  nature: [
    { type: 'movie', title: 'Planet Earth', subtitle: 'Documentary', url: 'https://www.themoviedb.org/tv/1044' },
    { type: 'book', title: 'Silent Spring', subtitle: 'Environmental Classic', url: 'https://www.goodreads.com/book/show/27333.Silent_Spring' },
    { type: 'movie', title: 'March of the Penguins', subtitle: 'Documentary', url: 'https://www.themoviedb.org/movie/7200' },
    { type: 'book', title: 'The Hidden Life of Trees', subtitle: 'Nature Science', url: 'https://www.goodreads.com/book/show/28256439-the-hidden-life-of-trees' },
  ],
  photography: [
    { type: 'book', title: 'Understanding Exposure', subtitle: 'Photography Guide', url: 'https://www.goodreads.com/book/show/282263.Understanding_Exposure' },
    { type: 'movie', title: 'Life', subtitle: 'Drama', url: 'https://www.themoviedb.org/movie/187016' },
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
  const { user, session } = useAuth();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchPicks() {
      if (!user || !session) return;

      // Fetch both preferences and profile (for location)
      const [{ data: prefsData, error: prefsError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase
          .from('preferences')
          .select('interests, dietary_preferences')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('city, state')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (!isMounted) return;
      
      if (prefsError) console.error('Preferences fetch error:', prefsError);
      if (profileError) console.error('Profile fetch error:', profileError);

      const rawInterests = prefsData?.interests as string[] || [];
      const rawDietary = prefsData?.dietary_preferences as string[] || [];
      const city = profileData?.city || '';
      
      // Normalize and filter out "none" values
      const interests = rawInterests.map(i => i.toLowerCase()).filter(i => i && i !== 'none');
      const dietary = rawDietary.map(d => d.toLowerCase()).filter(d => d && d !== 'none');
      
      // Use larger pool for better variety - picks rotate based on user + day
      const maxPoolSize = 30; // Check against max items in any category
      
      // Generate picks based on user interests - ensure uniqueness by type
      const userPicks: Pick[] = [];
      const usedTypes = new Set<string>();
      
      // Add location-aware food pick based on dietary preferences OR cooking interest
      if (dietary.length > 0) {
        for (const diet of dietary) {
          const dietPicks = getFoodByDiet(diet, city);
          if (dietPicks && dietPicks.length > 0 && !usedTypes.has('food')) {
            const pickIndex = getDailyIndex(dietPicks.length, user.id);
            userPicks.push(dietPicks[pickIndex]);
            usedTypes.add('food');
            break;
          }
        }
      }
      
      // If user has cooking interest but no dietary food pick yet, add a location-aware restaurant
      if (interests.includes('cooking') && !usedTypes.has('food')) {
        const cookingFoodPicks = [
          { type: 'food' as const, title: 'Best Local Eats', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/best+restaurants${city ? `+near+${encodeURIComponent(city)}` : ''}` },
          { type: 'food' as const, title: 'Hidden Gem Restaurant', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/hidden+gem+restaurant${city ? `+near+${encodeURIComponent(city)}` : ''}` },
          { type: 'food' as const, title: 'Highly Rated Dining', subtitle: `Near ${city || 'you'}`, url: `https://www.google.com/maps/search/highly+rated+restaurant${city ? `+near+${encodeURIComponent(city)}` : ''}` },
        ];
        const pickIndex = getDailyIndex(cookingFoodPicks.length, user.id);
        userPicks.push(cookingFoodPicks[pickIndex]);
        usedTypes.add('food');
      }
      
      // Then add picks based on interests
      for (const interest of interests) {
        const interestPicks = picksByInterest[interest];
        if (interestPicks && interestPicks.length > 0) {
          // Get the pick for today based on daily rotation with user-specific offset
          const pickIndex = getDailyIndex(interestPicks.length, user.id);
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
    
    return () => {
      isMounted = false;
    };
  }, [user, session]);

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