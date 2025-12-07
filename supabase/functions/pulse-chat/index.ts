import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to fetch live data from other edge functions
async function fetchLiveContext(city?: string, country?: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !serviceKey) {
    console.log("Missing Supabase credentials for live context");
    return "";
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${serviceKey}`,
  };

  let liveContext = "\n\n## Current World Context:\n";
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  liveContext += `**Today's Date**: ${today}\n`;

  try {
    // Fetch weather if we have location
    if (city) {
      const weatherRes = await fetch(`${supabaseUrl}/functions/v1/get-weather`, {
        method: "POST",
        headers,
        body: JSON.stringify({ city, units: "imperial" }),
      });
      if (weatherRes.ok) {
        const weather = await weatherRes.json();
        if (weather.current) {
          liveContext += `\n**Current Weather in ${city}**:\n`;
          liveContext += `- Temperature: ${Math.round(weather.current.temp)}°F (feels like ${Math.round(weather.current.feels_like)}°F)\n`;
          liveContext += `- Conditions: ${weather.current.weather?.[0]?.description || 'N/A'}\n`;
          liveContext += `- Humidity: ${weather.current.humidity}%\n`;
        }
      }
    }

    // Fetch latest news
    const newsRes = await fetch(`${supabaseUrl}/functions/v1/get-news`, {
      method: "POST",
      headers,
      body: JSON.stringify({ category: "general", pageSize: 5 }),
    });
    if (newsRes.ok) {
      const news = await newsRes.json();
      if (news.articles?.length > 0) {
        liveContext += `\n**Today's Top Headlines**:\n`;
        news.articles.slice(0, 5).forEach((article: { title: string; source?: { name?: string } }, i: number) => {
          liveContext += `${i + 1}. ${article.title} (${article.source?.name || 'News'})\n`;
        });
      }
    }

    // Fetch daily quote
    const quoteRes = await fetch(`${supabaseUrl}/functions/v1/daily-quote`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    if (quoteRes.ok) {
      const quote = await quoteRes.json();
      if (quote.text) {
        liveContext += `\n**Daily Inspiration**: "${quote.text}" — ${quote.author || 'Unknown'}\n`;
      }
    }

  } catch (error) {
    console.error("Error fetching live context:", error);
  }

  return liveContext;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, aiName, aiPersonality, humorLevel, formalityLevel, userContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build personality-based system prompt
    const personalityTraits = {
      friendly: "You are warm, approachable, and conversational. Use friendly language and show genuine interest.",
      professional: "You are formal, precise, and business-like. Use proper grammar and structured responses.",
      balanced: "You are a mix of casual and formal. Adapt your tone based on the conversation context.",
      witty: "You are clever, playful, and occasionally use humor. Keep things light while being helpful.",
    };

    const humorDescription = humorLevel > 70 ? "Use humor and playful language often." 
      : humorLevel > 40 ? "Occasionally add light humor when appropriate."
      : "Keep responses serious and focused.";

    const formalityDescription = formalityLevel > 70 ? "Use formal language and professional tone."
      : formalityLevel > 40 ? "Use a balanced, conversational tone."
      : "Use casual, friendly language.";

    // Build user context section
    let userContextSection = "";
    if (userContext) {
      const { profile, preferences, tasks } = userContext;
      
      if (profile) {
        const userName = profile.full_name || "this user";
        userContextSection += `\n\n## About ${userName}:\n`;
        if (profile.full_name) userContextSection += `- Name: ${profile.full_name}\n`;
        if (profile.city || profile.country) {
          userContextSection += `- Location: ${[profile.city, profile.country].filter(Boolean).join(", ")}\n`;
        }
        if (profile.age_range) userContextSection += `- Age range: ${profile.age_range}\n`;
        if (profile.household_type) userContextSection += `- Household: ${profile.household_type}\n`;
      }
      
      if (preferences) {
        if (preferences.dietary_preferences?.length > 0) {
          userContextSection += `- Dietary preferences: ${preferences.dietary_preferences.join(", ")}\n`;
        }
        if (preferences.interests?.length > 0) {
          userContextSection += `- Interests: ${preferences.interests.join(", ")}\n`;
        }
        if (preferences.temperature_unit) {
          userContextSection += `- Prefers temperature in: ${preferences.temperature_unit}\n`;
        }
      }
      
      if (tasks && tasks.length > 0) {
        userContextSection += `\n## Active Tasks:\n`;
        tasks.forEach((task: { title: string; completed: boolean; due_date?: string }) => {
          const status = task.completed ? "✓" : "○";
          const dueStr = task.due_date ? ` (due: ${task.due_date})` : "";
          userContextSection += `- ${status} ${task.title}${dueStr}\n`;
        });
      }
    }

    // Fetch live world context (weather, news, etc.)
    const userCity = userContext?.profile?.city;
    const userCountry = userContext?.profile?.country;
    const liveWorldContext = await fetchLiveContext(userCity, userCountry);

    const systemPrompt = `You are ${aiName || 'Pulse'}, a personal AI assistant for PulseOS - a life operating system that helps users optimize their daily life.

${personalityTraits[aiPersonality as keyof typeof personalityTraits] || personalityTraits.balanced}

${humorDescription}
${formalityDescription}
${userContextSection}
${liveWorldContext}

Your role is to:
- Help users with daily planning and productivity
- Provide personalized recommendations based on their interests, location, and dietary preferences
- Answer questions about current events, weather, and the world using the live context provided
- Be supportive and encouraging
- Reference their tasks, interests, location, or current news when relevant

You have access to current weather data, today's news headlines, and user-specific information. Use this knowledge to give informed, timely, and personalized responses.

Keep responses concise but helpful. Use markdown formatting when it improves readability.`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
