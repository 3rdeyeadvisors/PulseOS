// Mock service for entertainment picks
interface MediaPick {
  title: string;
  artist?: string;
  genre: string;
  imageUrl?: string;
  reason: string;
}

export async function getSongOfTheDay(genres: string[]): Promise<MediaPick> {
  await new Promise((r) => setTimeout(r, 200));
  
  const songs = [
    { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Synth-pop', reason: 'Upbeat energy for your day' },
    { title: 'Flowers', artist: 'Miley Cyrus', genre: 'Pop', reason: 'Feel-good anthem' },
    { title: 'Anti-Hero', artist: 'Taylor Swift', genre: 'Pop', reason: 'Relatable lyrics' },
    { title: 'As It Was', artist: 'Harry Styles', genre: 'Pop Rock', reason: 'Perfect morning vibes' },
  ];
  
  return songs[Math.floor(Math.random() * songs.length)];
}

export async function getPodcastOfTheDay(categories: string[]): Promise<MediaPick> {
  await new Promise((r) => setTimeout(r, 200));
  
  const podcasts = [
    { title: 'The Daily', artist: 'NYT', genre: 'News', reason: '20 min briefing' },
    { title: 'Huberman Lab', artist: 'Andrew Huberman', genre: 'Science', reason: 'Brain optimization tips' },
    { title: 'How I Built This', artist: 'NPR', genre: 'Business', reason: 'Inspiring founder stories' },
    { title: 'Lex Fridman Podcast', artist: 'Lex Fridman', genre: 'Tech', reason: 'Deep tech conversations' },
  ];
  
  return podcasts[Math.floor(Math.random() * podcasts.length)];
}

export async function getMovieOfTheDay(genres: string[]): Promise<MediaPick> {
  await new Promise((r) => setTimeout(r, 200));
  
  const movies = [
    { title: 'Dune: Part Two', genre: 'Sci-Fi', reason: 'Epic visual experience' },
    { title: 'Poor Things', genre: 'Comedy Drama', reason: 'Unique storytelling' },
    { title: 'Oppenheimer', genre: 'Drama', reason: 'Masterful filmmaking' },
    { title: 'Spider-Man: Across the Spider-Verse', genre: 'Animation', reason: 'Stunning animation' },
  ];
  
  return movies[Math.floor(Math.random() * movies.length)];
}
