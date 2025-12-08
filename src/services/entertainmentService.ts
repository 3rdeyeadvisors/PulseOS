import { supabase } from '@/integrations/supabase/client';

export interface MediaPick {
  title: string;
  artist?: string;
  genre: string;
  imageUrl?: string;
  reason: string;
  spotifyUrl?: string;
  previewUrl?: string;
  albumArt?: string;
  posterUrl?: string;
  tmdbUrl?: string;
  overview?: string;
}

interface MediaResponse {
  success: boolean;
  type: string;
  title: string;
  artist?: string;
  genre: string;
  reason: string;
  spotifyUrl?: string;
  previewUrl?: string;
  albumArt?: string;
  posterUrl?: string;
  tmdbUrl?: string;
  overview?: string;
  error?: string;
}

interface CachedMedia {
  data: MediaPick;
  date: string; // YYYY-MM-DD format
  interestsHash: string; // To invalidate if preferences change
}

function getTodayDate(): string {
  // Use UTC date to ensure consistency across timezones and prevent premature cache invalidation
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function hashInterests(interests: string[]): string {
  return interests.sort().join(',').toLowerCase();
}

function getCacheKey(type: string, userId: string): string {
  return `media_${type}_${userId}`;
}

function getCachedMedia(type: string, userId: string, interests: string[]): MediaPick | null {
  try {
    const key = getCacheKey(type, userId);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedMedia = JSON.parse(cached);
    const today = getTodayDate();
    const currentHash = hashInterests(interests);

    // Return cached data if same day AND same preferences
    if (parsed.date === today && parsed.interestsHash === currentHash) {
      console.log(`Using cached ${type} for today`);
      return parsed.data;
    }

    return null;
  } catch {
    return null;
  }
}

function setCachedMedia(type: string, userId: string, interests: string[], data: MediaPick): void {
  try {
    const key = getCacheKey(type, userId);
    const cached: CachedMedia = {
      data,
      date: getTodayDate(),
      interestsHash: hashInterests(interests),
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

export async function getSongOfTheDay(interests: string[], refresh = false, userId?: string): Promise<MediaPick> {
  return getMediaRecommendation('song', interests, refresh, userId);
}

export async function getPodcastOfTheDay(interests: string[], refresh = false, userId?: string): Promise<MediaPick> {
  return getMediaRecommendation('podcast', interests, refresh, userId);
}

export async function getMovieOfTheDay(interests: string[], refresh = false, userId?: string): Promise<MediaPick> {
  return getMediaRecommendation('movie', interests, refresh, userId);
}

async function getMediaRecommendation(
  type: 'song' | 'podcast' | 'movie',
  interests: string[],
  refresh: boolean,
  userId?: string
): Promise<MediaPick> {
  // Check cache first (unless refreshing)
  if (!refresh && userId) {
    const cached = getCachedMedia(type, userId, interests);
    if (cached) {
      return cached;
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke<MediaResponse>('media-recommendations', {
      body: { type, interests, refresh }
    });

    if (error) {
      console.error(`${type} recommendation error:`, error);
      return getFallback(type);
    }

    if (data?.title) {
      const result: MediaPick = {
        title: data.title,
        artist: data.artist,
        genre: data.genre,
        reason: data.reason,
        spotifyUrl: data.spotifyUrl,
        previewUrl: data.previewUrl,
        albumArt: data.albumArt,
        posterUrl: data.posterUrl,
        tmdbUrl: data.tmdbUrl,
        overview: data.overview,
      };

      // Cache the result for the day
      if (userId) {
        setCachedMedia(type, userId, interests, result);
      }

      return result;
    }

    return getFallback(type);
  } catch (err) {
    console.error(`${type} recommendation error:`, err);
    return getFallback(type);
  }
}

function getFallback(type: 'song' | 'podcast' | 'movie'): MediaPick {
  const fallbacks = {
    song: { 
      title: 'Blinding Lights', 
      artist: 'The Weeknd', 
      genre: 'Synth-pop', 
      reason: 'Upbeat energy for your day' 
    },
    podcast: { 
      title: 'The Daily', 
      artist: 'NYT', 
      genre: 'News', 
      reason: 'Quick 20-minute briefing' 
    },
    movie: { 
      title: 'Dune: Part Two', 
      artist: 'Denis Villeneuve', 
      genre: 'Sci-Fi', 
      reason: 'Epic visual experience' 
    },
  };
  return fallbacks[type];
}
