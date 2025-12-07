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
    console.log("Spotify credentials not configured");
    return null;
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      console.error("Spotify token error:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (err) {
    console.error("Spotify auth error:", err);
    return null;
  }
}

// Get a random song recommendation from Spotify
async function getSpotifySong(interests: string[], token: string): Promise<any> {
  // Map common interests to Spotify genre seeds
  const genreMap: Record<string, string> = {
    "pop": "pop",
    "rock": "rock",
    "hip-hop": "hip-hop",
    "hip hop": "hip-hop",
    "rap": "hip-hop",
    "electronic": "electronic",
    "edm": "edm",
    "jazz": "jazz",
    "classical": "classical",
    "r&b": "r-n-b",
    "country": "country",
    "indie": "indie",
    "alternative": "alt-rock",
    "metal": "metal",
    "folk": "folk",
    "latin": "latin",
    "k-pop": "k-pop",
    "workout": "work-out",
    "chill": "chill",
    "party": "party",
  };

  // Find matching genres from interests
  let seedGenres = interests
    .map(i => genreMap[i.toLowerCase()])
    .filter(Boolean)
    .slice(0, 2);
  
  if (seedGenres.length === 0) {
    seedGenres = ["pop", "hip-hop"]; // Default genres
  }

  try {
    // Get recommendations from Spotify
    const params = new URLSearchParams({
      seed_genres: seedGenres.join(","),
      limit: "20",
      market: "US",
    });

    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?${params}`,
      {
        headers: { "Authorization": `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      console.error("Spotify recommendations error:", await response.text());
      return null;
    }

    const data = await response.json();
    
    if (!data.tracks || data.tracks.length === 0) {
      return null;
    }

    // Pick a random track
    const track = data.tracks[Math.floor(Math.random() * data.tracks.length)];
    
    return {
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      genre: seedGenres[0].charAt(0).toUpperCase() + seedGenres[0].slice(1),
      reason: `Trending on Spotify • ${track.popularity}% popularity`,
      spotifyUrl: track.external_urls?.spotify,
      previewUrl: track.preview_url,
      albumArt: track.album?.images?.[0]?.url,
    };
  } catch (err) {
    console.error("Spotify API error:", err);
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
