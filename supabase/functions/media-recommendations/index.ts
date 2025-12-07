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

// Fallback to AI for podcasts and movies
async function getAIRecommendation(type: string, interests: string[], refresh: boolean): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const interestsList = interests.length > 0 ? interests.join(", ") : "general popular content";

  const typePrompts: Record<string, string> = {
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
    }

    // Fallback to AI for podcasts, movies, or if Spotify failed
    if (!result) {
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
