import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MediaRequest {
  type: "song" | "podcast" | "movie";
  interests?: string[];
  refresh?: boolean;
}

// Get Spotify access token using Client Credentials flow
async function getSpotifyToken(): Promise<string | null> {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  
  if (!clientId || !clientSecret) {
    console.log("Spotify credentials not configured - clientId:", !!clientId, "clientSecret:", !!clientSecret);
    return null;
  }

  try {
    // Use TextEncoder for proper base64 encoding in Deno
    const credentials = `${clientId}:${clientSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(credentials);
    const base64Credentials = btoa(String.fromCharCode(...data));
    
    console.log("Requesting Spotify token...");
    
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${base64Credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("Spotify token error - status:", response.status, "body:", responseText);
      return null;
    }

    const tokenData = JSON.parse(responseText);
    console.log("Spotify token obtained successfully");
    return tokenData.access_token;
  } catch (err) {
    console.error("Spotify auth error:", err);
    return null;
  }
}

// Get a song from Spotify using Search API (more reliable than recommendations)
async function getSpotifySong(interests: string[], token: string): Promise<any> {
  // Map interests to search-friendly terms
  const searchTermMap: Record<string, string[]> = {
    "pop": ["pop hits 2024", "top 40", "pop music"],
    "rock": ["rock hits", "alternative rock", "indie rock"],
    "hip-hop": ["hip hop 2024", "rap hits", "trap"],
    "hip hop": ["hip hop 2024", "rap hits"],
    "rap": ["rap hits 2024", "hip hop"],
    "electronic": ["edm hits", "electronic dance", "house music"],
    "edm": ["edm 2024", "dance hits"],
    "jazz": ["jazz popular", "smooth jazz"],
    "classical": ["classical favorites", "piano classics"],
    "r&b": ["r&b hits", "soul music"],
    "country": ["country hits 2024", "country music"],
    "indie": ["indie hits", "indie pop"],
    "alternative": ["alternative rock", "alt hits"],
    "metal": ["metal hits", "rock metal"],
    "folk": ["folk music", "acoustic folk"],
    "latin": ["latin hits 2024", "reggaeton"],
    "k-pop": ["kpop hits", "korean pop"],
    "fitness": ["workout music", "gym playlist", "running songs"],
    "workout": ["workout hits", "gym motivation"],
    "chill": ["chill vibes", "relaxing music"],
    "party": ["party hits 2024", "dance party"],
    "tech": ["electronic ambient", "synthwave"],
    "travel": ["road trip songs", "feel good music"],
    "nature": ["ambient nature", "peaceful music"],
    "reading": ["lo-fi study", "concentration music"],
  };

  // Build search queries from interests
  const searchQueries: string[] = [];
  for (const interest of interests) {
    const terms = searchTermMap[interest.toLowerCase()];
    if (terms) {
      searchQueries.push(...terms);
    }
  }

  // Default queries if no matches
  if (searchQueries.length === 0) {
    searchQueries.push("top hits 2024", "popular songs", "trending music");
  }

  // Pick a random search query
  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  console.log("Spotify - Searching for:", query);

  try {
    const params = new URLSearchParams({
      q: query,
      type: "track",
      limit: "20",
      market: "US",
    });

    const url = `https://api.spotify.com/v1/search?${params}`;
    console.log("Spotify - Search URL:", url);

    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Spotify search error - status:", response.status, "body:", responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    
    if (!data.tracks?.items || data.tracks.items.length === 0) {
      console.log("Spotify - No tracks found");
      return null;
    }

    console.log("Spotify - Found", data.tracks.items.length, "tracks");

    // Pick a random track from results
    const track = data.tracks.items[Math.floor(Math.random() * data.tracks.items.length)];
    
    const result = {
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      genre: query.split(" ")[0].charAt(0).toUpperCase() + query.split(" ")[0].slice(1),
      reason: `${track.popularity}% popularity on Spotify`,
      spotifyUrl: track.external_urls?.spotify || null,
      previewUrl: track.preview_url || null,
      albumArt: track.album?.images?.[0]?.url || null,
    };
    
    console.log("Spotify - Returning:", result.title, "by", result.artist, "albumArt:", result.albumArt);
    
    return result;
  } catch (err) {
    console.error("Spotify search error:", err);
    return null;
  }
}

// Get podcast from Spotify using Search API
async function getSpotifyPodcast(interests: string[], token: string): Promise<any> {
  const searchTermMap: Record<string, string[]> = {
    "tech": ["tech podcasts", "technology news", "startup podcasts"],
    "fitness": ["fitness podcasts", "health wellness", "workout motivation"],
    "travel": ["travel podcasts", "adventure stories", "travel tips"],
    "reading": ["book podcasts", "literature discussions", "audiobooks"],
    "finance": ["finance podcasts", "investing money", "personal finance"],
    "nature": ["nature podcasts", "environment science", "outdoor adventures"],
    "podcasts": ["top podcasts 2024", "popular shows"],
  };

  const searchQueries: string[] = [];
  for (const interest of interests) {
    const terms = searchTermMap[interest.toLowerCase()];
    if (terms) {
      searchQueries.push(...terms);
    }
  }

  if (searchQueries.length === 0) {
    searchQueries.push("top podcasts 2024", "popular podcasts", "best shows");
  }

  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  console.log("Spotify Podcast - Searching for:", query);

  try {
    const params = new URLSearchParams({
      q: query,
      type: "show",
      limit: "10",
      market: "US",
    });

    const url = `https://api.spotify.com/v1/search?${params}`;
    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Spotify podcast search error - status:", response.status, "body:", responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    
    if (!data.shows?.items || data.shows.items.length === 0) {
      console.log("Spotify - No podcasts found");
      return null;
    }

    console.log("Spotify - Found", data.shows.items.length, "podcasts");

    const show = data.shows.items[Math.floor(Math.random() * data.shows.items.length)];
    
    return {
      title: show.name,
      artist: show.publisher,
      genre: query.split(" ")[0].charAt(0).toUpperCase() + query.split(" ")[0].slice(1),
      reason: `${show.total_episodes} episodes available`,
      spotifyUrl: show.external_urls?.spotify || null,
      albumArt: show.images?.[0]?.url || null,
    };
  } catch (err) {
    console.error("Spotify podcast error:", err);
    return null;
  }
}

// Get movie from TMDb API with better variety
async function getTMDbMovie(interests: string[], refresh: boolean): Promise<any> {
  const apiKey = Deno.env.get("TMDB_API_KEY");
  if (!apiKey) {
    console.log("TMDb API key not configured");
    return null;
  }

  // Expanded genre map covering more interests
  const genreMap: Record<string, number[]> = {
    "tech": [878], // Sci-Fi
    "technology": [878],
    "travel": [12], // Adventure
    "fitness": [28], // Action
    "health": [28, 99], // Action, Documentary
    "reading": [18, 36], // Drama, History
    "books": [18, 36],
    "finance": [80, 53], // Crime, Thriller
    "money": [80, 53],
    "nature": [99, 12], // Documentary, Adventure
    "podcasts": [35, 18], // Comedy, Drama
    "music": [10402], // Music
    "gaming": [878, 28], // Sci-Fi, Action
    "cooking": [35, 99], // Comedy, Documentary
    "food": [35, 99],
    "art": [18, 99], // Drama, Documentary
    "science": [878, 99], // Sci-Fi, Documentary
    "history": [36, 10752], // History, War
    "sports": [28, 99], // Action, Documentary
    "comedy": [35],
    "horror": [27],
    "romance": [10749],
    "thriller": [53],
    "animation": [16],
    "family": [10751],
    "mystery": [9648],
    "fantasy": [14],
  };

  let genreIds: number[] = [];
  for (const interest of interests) {
    const lowerInterest = interest.toLowerCase();
    const ids = genreMap[lowerInterest];
    if (ids) {
      genreIds.push(...ids);
    }
  }

  // Wider default selection if no genres matched
  if (genreIds.length === 0) {
    genreIds = [28, 12, 878, 35, 18, 53]; // Action, Adventure, Sci-Fi, Comedy, Drama, Thriller
  }

  // Use unique genres, pick 1-2 randomly for more variety
  const uniqueGenres = [...new Set(genreIds)];
  const selectedGenres = uniqueGenres.sort(() => Math.random() - 0.5).slice(0, 2);
  
  // Random page between 1-10 for much more variety
  const randomPage = Math.floor(Math.random() * 10) + 1;
  
  // Randomly pick a date range for more variety
  const dateRanges = [
    { gte: "2023-01-01", lte: "2025-12-31" }, // Recent
    { gte: "2020-01-01", lte: "2022-12-31" }, // Pandemic era
    { gte: "2015-01-01", lte: "2019-12-31" }, // 2010s
    { gte: "2000-01-01", lte: "2014-12-31" }, // 2000s-2010s
  ];
  const dateRange = dateRanges[Math.floor(Math.random() * dateRanges.length)];

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      language: "en-US",
      sort_by: "popularity.desc",
      "vote_count.gte": "200",
      "vote_average.gte": "6.5",
      "primary_release_date.gte": dateRange.gte,
      "primary_release_date.lte": dateRange.lte,
      with_genres: selectedGenres.join("|"),
      page: randomPage.toString(),
    });

    const url = `https://api.themoviedb.org/3/discover/movie?${params}`;
    console.log("TMDb - Fetching movies, page:", randomPage, "genres:", selectedGenres, "dates:", dateRange);

    const response = await fetch(url);
    const responseText = await response.text();

    if (!response.ok) {
      console.error("TMDb error - status:", response.status, "body:", responseText);
      return null;
    }

    const data = JSON.parse(responseText);

    if (!data.results || data.results.length === 0) {
      console.log("TMDb - No movies found, trying page 1");
      // Retry with page 1 if random page returned nothing
      params.set("page", "1");
      const retryResponse = await fetch(`https://api.themoviedb.org/3/discover/movie?${params}`);
      const retryData = await retryResponse.json();
      if (!retryData.results || retryData.results.length === 0) {
        return null;
      }
      data.results = retryData.results;
    }

    console.log("TMDb - Found", data.results.length, "movies");

    // Pick a random movie from ALL results (not just top 10)
    const movie = data.results[Math.floor(Math.random() * data.results.length)];

    // Fetch genre names for display
    const genreResponse = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`);
    const genreData = await genreResponse.json();
    const genreNames = genreData.genres || [];
    const movieGenre = movie.genre_ids?.[0] 
      ? genreNames.find((g: any) => g.id === movie.genre_ids[0])?.name || "Movie"
      : "Movie";

    return {
      title: movie.title,
      artist: movie.release_date?.split("-")[0] || "2024",
      genre: movieGenre,
      reason: `${Math.round(movie.vote_average * 10)}% rating on TMDb`,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
      overview: movie.overview?.slice(0, 100) + (movie.overview?.length > 100 ? "..." : ""),
    };
  } catch (err) {
    console.error("TMDb error:", err);
    return null;
  }
}

// Fallback to AI for any type
async function getAIRecommendation(type: string, interests: string[], refresh: boolean): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const interestsList = interests.length > 0 ? interests.join(", ") : "general popular content";

  const typePrompts: Record<string, string> = {
    song: `Recommend ONE popular song that matches these interests: ${interestsList}.`,
    podcast: `Recommend ONE popular podcast episode or series that matches these interests: ${interestsList}. Focus on educational, entertaining, or inspiring content.`,
    movie: `Recommend ONE movie (preferably from 2022-2025) that matches these interests: ${interestsList}. Consider what's trending on streaming platforms.`,
  };

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: `You are a personalized ${type} recommendation engine. Always recommend REAL, existing content.` },
        { role: "user", content: `${typePrompts[type]}\n\nReturn JSON: {"title": "<title>", "artist": "<creator>", "genre": "<genre>", "reason": "<why this is great, max 50 chars>"}${refresh ? " Pick something different from typical recommendations." : ""}` },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, interests = [], refresh }: MediaRequest = await req.json();
    console.log(`Fetching ${type} recommendation, interests:`, interests);

    let result;

    if (type === "song") {
      // Try Spotify first
      const token = await getSpotifyToken();
      if (token) {
        result = await getSpotifySong(interests, token);
        if (result) {
          console.log("Got Spotify song:", result.title);
        }
      }
    } else if (type === "podcast") {
      // Try Spotify for podcasts
      const token = await getSpotifyToken();
      if (token) {
        result = await getSpotifyPodcast(interests, token);
        if (result) {
          console.log("Got Spotify podcast:", result.title);
        }
      }
    } else if (type === "movie") {
      // Try TMDb for movies
      result = await getTMDbMovie(interests, refresh || false);
      if (result) {
        console.log("Got TMDb movie:", result.title);
      }
    }

    // Fallback to AI if API failed
    if (!result) {
      console.log(`${type} API failed, falling back to AI`);
      result = await getAIRecommendation(type, interests, refresh || false);
    }

    // Final fallback
    if (!result) {
      const fallbacks: Record<string, any> = {
        song: { title: "Blinding Lights", artist: "The Weeknd", genre: "Synth-pop", reason: "Upbeat energy for your day" },
        podcast: { title: "The Daily", artist: "NYT", genre: "News", reason: "Quick 20-minute briefing" },
        movie: { title: "Dune: Part Two", artist: "Denis Villeneuve", genre: "Sci-Fi", reason: "Epic visual experience" },
      };
      result = fallbacks[type];
    }

    return new Response(JSON.stringify({
      success: true,
      type,
      ...result,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Media recommendation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
