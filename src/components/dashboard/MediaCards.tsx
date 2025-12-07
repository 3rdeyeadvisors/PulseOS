import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Music, Headphones, Film, RefreshCw, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getSongOfTheDay, getPodcastOfTheDay, getMovieOfTheDay, MediaPick } from '@/services/entertainmentService';

type MediaType = 'song' | 'podcast' | 'movie';

interface MediaCardProps {
  type: MediaType;
}

const config = {
  song: { icon: Music, label: 'Song of the Day', color: 'text-green-400 bg-green-400/10' },
  podcast: { icon: Headphones, label: 'Podcast Pick', color: 'text-purple-400 bg-purple-400/10' },
  movie: { icon: Film, label: 'Movie Pick', color: 'text-amber-400 bg-amber-400/10' },
};

export function MediaCard({ type }: MediaCardProps) {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { icon: Icon, label, color } = config[type];

  const fetchMedia = async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: prefs } = await supabase
        .from('preferences')
        .select('interests')
        .eq('user_id', user.id)
        .maybeSingle();

      const interests = (prefs?.interests as string[]) || [];

      let data: MediaPick;
      switch (type) {
        case 'song':
          data = await getSongOfTheDay(interests, isRefresh);
          break;
        case 'podcast':
          data = await getPodcastOfTheDay(interests, isRefresh);
          break;
        case 'movie':
          data = await getMovieOfTheDay(interests, isRefresh);
          break;
      }

      setMedia(data);
    } catch (err) {
      console.error(`${type} fetch error:`, err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [user, type]);

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => fetchMedia(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {media ? (
        <div className="flex gap-3">
          {/* Album art for songs or podcasts */}
          {(type === 'song' || type === 'podcast') && media.albumArt && (
            <img 
              src={media.albumArt} 
              alt={media.title}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
          )}
          
          {/* Movie poster */}
          {type === 'movie' && media.posterUrl && (
            <img 
              src={media.posterUrl} 
              alt={media.title}
              className="w-14 h-20 rounded-lg object-cover flex-shrink-0"
            />
          )}
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold truncate">{media.title}</p>
              
              {/* Spotify link for songs and podcasts */}
              {(type === 'song' || type === 'podcast') && media.spotifyUrl && (
                <a 
                  href={media.spotifyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-1 rounded-full hover:bg-green-500/20 transition-colors"
                  title="Open in Spotify"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-green-400" />
                </a>
              )}
              
              {/* TMDb link for movies */}
              {type === 'movie' && media.tmdbUrl && (
                <a 
                  href={media.tmdbUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-1 rounded-full hover:bg-amber-500/20 transition-colors"
                  title="View on TMDb"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
                </a>
              )}
            </div>
            {media.artist && (
              <p className="text-sm text-muted-foreground truncate">{media.artist}</p>
            )}
            <p className="text-xs text-primary truncate">{media.reason}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No pick available</p>
      )}
    </div>
  );
}

export function SongCard() {
  return <MediaCard type="song" />;
}

export function PodcastCard() {
  return <MediaCard type="podcast" />;
}

export function MovieCard() {
  return <MediaCard type="movie" />;
}
