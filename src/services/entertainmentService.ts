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

export async function getSongOfTheDay(interests: string[], refresh = false): Promise<MediaPick> {
  return getMediaRecommendation('song', interests, refresh);
}

export async function getPodcastOfTheDay(interests: string[], refresh = false): Promise<MediaPick> {
  return getMediaRecommendation('podcast', interests, refresh);
}

export async function getMovieOfTheDay(interests: string[], refresh = false): Promise<MediaPick> {
  return getMediaRecommendation('movie', interests, refresh);
}

async function getMediaRecommendation(
  type: 'song' | 'podcast' | 'movie',
  interests: string[],
  refresh: boolean
): Promise<MediaPick> {
  try {
    const { data, error } = await supabase.functions.invoke<MediaResponse>('media-recommendations', {
      body: { type, interests, refresh }
    });

    if (error) {
      console.error(`${type} recommendation error:`, error);
      return getFallback(type);
    }

    if (data?.title) {
      return {
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
