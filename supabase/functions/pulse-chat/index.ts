import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to detect if a query needs web search
function needsWebSearch(message: string): boolean {
  const searchTriggers = [
    /what is|what are|who is|who are|where is|when did|when was|how to|how do/i,
    /latest|recent|current|today's|this week|breaking/i,
    /tell me about|explain|define|describe/i,
    /news about|update on|status of/i,
    /price of|cost of|value of/i,
    /best|top|recommend/i,
    /\?$/,
  ];
  
  // Check if message matches any search triggers
  return searchTriggers.some(trigger => trigger.test(message));
}

// Helper to search the web using Perplexity
async function searchWeb(query: string): Promise<string> {
  const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
  
  if (!perplexityKey) {
    console.log("Perplexity API key not configured");
    return "";
  }

  try {
    console.log("Searching web for:", query);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Provide concise, factual answers with key details. Include relevant dates, numbers, and sources when available. Keep responses under 300 words.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 500,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'week',
      }),
    });

    if (!response.ok) {
      console.error("Perplexity API error:", response.status, await response.text());
      return "";
    }

    const data = await response.json();
    const searchResult = data.choices?.[0]?.message?.content || "";
    
    if (searchResult) {
      console.log("Web search successful, got result");
      return `\n\n## Web Search Results:\n${searchResult}\n`;
    }
    
    return "";
  } catch (error) {
    console.error("Web search error:", error);
    return "";
  }
}

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

    // Fetch upcoming events if we have location
    if (city) {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
        const eventsRes = await fetch(`${supabaseUrl}/functions/v1/ticketmaster-events`, {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            city, 
            state: undefined,
            interests: [],
            radius: 100,
            timezone: userTimezone
          }),
        });
        if (eventsRes.ok) {
          const events = await eventsRes.json();
          if (events.events?.length > 0) {
            liveContext += `\n**Upcoming Events Near ${city}**:\n`;
            events.events.slice(0, 8).forEach((event: { 
              name: string; 
              date?: string; 
              time?: string;
              venue?: string;
              priceRange?: string;
              url?: string;
            }, i: number) => {
              const dateStr = event.date ? ` on ${event.date}` : '';
              const timeStr = event.time ? ` at ${event.time}` : '';
              const venueStr = event.venue ? ` @ ${event.venue}` : '';
              const priceStr = event.priceRange ? ` (${event.priceRange})` : '';
              liveContext += `${i + 1}. ${event.name}${dateStr}${timeStr}${venueStr}${priceStr}\n`;
            });
          }
        }
      } catch (eventError) {
        console.error("Error fetching events:", eventError);
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
    const body = await req.json();
    
    // Input validation
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate message structure and sanitize
    const messages = body.messages.map((msg: { role?: string; content?: string }) => {
      if (!msg.role || !msg.content) {
        throw new Error("Invalid message structure");
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new Error("Invalid message role");
      }
      // Limit content length to prevent abuse
      const content = String(msg.content).slice(0, 10000);
      return { role: msg.role, content };
    });

    if (messages.length === 0 || messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid number of messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiName = String(body.aiName || 'Pulse').slice(0, 50);
    const aiPersonality = String(body.aiPersonality || 'balanced').slice(0, 50);
    const humorLevel = Math.min(100, Math.max(0, Number(body.humorLevel) || 50));
    const formalityLevel = Math.min(100, Math.max(0, Number(body.formalityLevel) || 50));
    const userContext = body.userContext;
    
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

    // Check if the latest user message needs web search
    let webSearchContext = "";
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === "user").pop();
    if (lastUserMessage && needsWebSearch(lastUserMessage.content)) {
      webSearchContext = await searchWeb(lastUserMessage.content);
    }

    const systemPrompt = `You are ${aiName || 'Pulse'}, a personal AI assistant for PulseOS - a life operating system that helps users optimize their daily life.

${personalityTraits[aiPersonality as keyof typeof personalityTraits] || personalityTraits.balanced}

${humorDescription}
${formalityDescription}
${userContextSection}
${liveWorldContext}
${webSearchContext}

## CRITICAL RULES:
1. NEVER make up facts, statistics, prices, or information you don't have
2. If you don't know something, say "I don't have that information" rather than guessing
3. NEVER repeat the same phrases or sentences within a response
4. Keep responses concise and avoid redundancy
5. When you have web search results, use ONLY that information - do not embellish or add made-up details
6. Always cite sources when sharing factual information from web searches

Your role is to:
- Help users with daily planning and productivity
- Provide personalized recommendations based on their interests, location, and dietary preferences
- Answer questions using ONLY the live context and web search results provided - never fabricate information
- Be supportive and encouraging
- Reference their tasks, interests, location, or current news when relevant

You have access to:
- Current weather data for the user's location
- Today's news headlines
- User-specific information (profile, preferences, tasks)
- Real-time web search results for factual questions

Keep responses concise. Use markdown formatting when it improves readability. Vary your language - never repeat phrases.`;

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
