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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { type, interests = [], refresh }: MediaRequest = await req.json();
    
    console.log(`Fetching ${type} recommendation, interests:`, interests);

    const interestsList = interests.length > 0 
      ? interests.join(", ") 
      : "general popular content";

    const typePrompts = {
      song: `Recommend ONE currently popular or trending song (released in 2023-2025) that matches these interests: ${interestsList}. 
Consider the user's mood and suggest something energizing for daytime or relaxing for evening.`,
      podcast: `Recommend ONE popular podcast episode or series that matches these interests: ${interestsList}. 
Focus on educational, entertaining, or inspiring content that's highly rated.`,
      movie: `Recommend ONE movie (preferably from 2022-2025, or a classic if highly relevant) that matches these interests: ${interestsList}. 
Consider what's trending on streaming platforms.`,
    };

    const systemPrompt = `You are a personalized media recommendation engine. Always recommend REAL, existing ${type}s that users can actually find and enjoy. Be specific with titles and artists/creators.`;

    const userPrompt = `${typePrompts[type]}

Return a JSON object with this exact structure:
{
  "title": "<exact title>",
  "artist": "<artist/creator/director name>",
  "genre": "<primary genre>",
  "reason": "<1 sentence explaining why this is perfect for the user, max 60 chars>"
}

Be creative and varied - don't always pick the most obvious choice.${refresh ? " Pick something different from typical recommendations." : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8, // Higher temperature for variety
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response received for", type);

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr);
      // Fallback
      const fallbacks = {
        song: { title: "Blinding Lights", artist: "The Weeknd", genre: "Synth-pop", reason: "Upbeat energy for your day" },
        podcast: { title: "The Daily", artist: "NYT", genre: "News", reason: "Quick 20-minute briefing" },
        movie: { title: "Dune: Part Two", artist: "Denis Villeneuve", genre: "Sci-Fi", reason: "Epic visual experience" },
      };
      parsed = fallbacks[type];
    }

    return new Response(JSON.stringify({
      success: true,
      type,
      ...parsed,
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
