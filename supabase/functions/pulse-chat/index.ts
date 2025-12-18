import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to detect if a query needs web search
function needsWebSearch(message: string): boolean {
  const searchTriggers = [
    /what is|what are|who is|who are|where is|when did|when was|when is|how to|how do|how much|how many/i,
    /latest|recent|current|today|tonight|this week|this weekend|breaking|upcoming/i,
    /tell me about|explain|define|describe|give me|show me|find|look up|search/i,
    /news about|update on|status of|information on|info on|details about/i,
    /price of|cost of|value of|worth|salary|income/i,
    /best|top|recommend|suggest|popular|famous|trending/i,
    /events|concerts|shows|games|matches|performances|festivals|happenings/i,
    /weather|temperature|forecast|rain|snow|sunny/i,
    /movie|film|tv show|series|book|song|album|artist|actor|celebrity/i,
    /restaurant|food|eat|dining|bar|cafe|coffee/i,
    /stock|crypto|bitcoin|market|investing/i,
    /schedule|hours|open|closed|available/i,
    /\?$/,
  ];
  
  const wordCount = message.split(/\s+/).length;
  if (wordCount > 10) return true;
  
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
      console.log("Web search successful");
      return `\n\n[WEB_SEARCH_RESULTS]\n${searchResult}\n[/WEB_SEARCH_RESULTS]\n`;
    }
    
    return "";
  } catch (error) {
    console.error("Web search error:", error);
    return "";
  }
}

// Helper to fetch live data
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

  let liveContext = "\n\n[LIVE_DATA]\n";
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  liveContext += `Today: ${today}\n`;

  try {
    if (city) {
      const weatherRes = await fetch(`${supabaseUrl}/functions/v1/get-weather`, {
        method: "POST",
        headers,
        body: JSON.stringify({ city, units: "imperial" }),
      });
      if (weatherRes.ok) {
        const weather = await weatherRes.json();
        if (weather.current) {
          liveContext += `Weather in ${city}: ${Math.round(weather.current.temp)}°F, ${weather.current.weather?.[0]?.description || 'N/A'}\n`;
        }
      }
    }

    const newsRes = await fetch(`${supabaseUrl}/functions/v1/get-news`, {
      method: "POST",
      headers,
      body: JSON.stringify({ category: "general", pageSize: 3 }),
    });
    if (newsRes.ok) {
      const news = await newsRes.json();
      if (news.articles?.length > 0) {
        liveContext += `Headlines: ${news.articles.slice(0, 3).map((a: { title: string }) => a.title).join(' | ')}\n`;
      }
    }

    if (city) {
      try {
        const eventsRes = await fetch(`${supabaseUrl}/functions/v1/ticketmaster-events`, {
          method: "POST",
          headers,
          body: JSON.stringify({ city, radius: 50 }),
        });
        if (eventsRes.ok) {
          const events = await eventsRes.json();
          if (events.events?.length > 0) {
            liveContext += `Local events: ${events.events.slice(0, 3).map((e: { name: string }) => e.name).join(', ')}\n`;
          }
        }
      } catch (e) {
        console.error("Events error:", e);
      }
    }

  } catch (error) {
    console.error("Error fetching live context:", error);
  }

  liveContext += "[/LIVE_DATA]\n";
  return liveContext;
}

// Build detailed personality instructions
function buildPersonalityPrompt(
  aiName: string,
  personality: string,
  humorLevel: number,
  formalityLevel: number
): string {
  // Detailed personality definitions
  const personalityStyles: Record<string, string> = {
    friendly: `You're warm, caring, and genuinely interested in the user. You:
- Use their name when it feels natural
- Show empathy and understanding ("I totally get that!", "That sounds exciting!")
- Ask follow-up questions to show you care
- Use casual, warm language with occasional exclamation marks
- Share enthusiasm about their interests
- Use phrases like "Hey!", "Oh nice!", "That's awesome!", "I'd love to help!"`,

    professional: `You're polished, articulate, and business-minded. You:
- Provide structured, well-organized responses
- Use precise language and avoid slang
- Present information clearly with bullet points when helpful
- Maintain a respectful, consultative tone
- Focus on actionable insights and efficiency
- Use phrases like "I'd recommend...", "Based on the information...", "Consider the following..."`,

    balanced: `You're adaptable and naturally conversational. You:
- Match the user's energy and tone
- Be friendly but not overly casual
- Provide helpful information without being stiff
- Use a mix of warmth and clarity
- Adjust formality based on the topic
- Use phrases like "Sure thing!", "Here's what I found...", "Good question!"`,

    witty: `You're clever, quick-witted, and entertainingly smart. You:
- Add playful observations and clever wordplay
- Use light sarcasm that's never mean-spirited
- Make unexpected connections that surprise and delight
- Include pop culture references when relevant
- Balance humor with actually being helpful
- Use phrases like "Well, well, well...", "Plot twist:", "Fun fact alert!", "Here's the thing..."`
  };

  // 5-level humor scale
  let humorStyle = "";
  if (humorLevel <= 20) {
    humorStyle = "Keep things straightforward and focused. Avoid jokes or playful language entirely. Be direct and informative.";
  } else if (humorLevel <= 40) {
    humorStyle = "Stay mostly serious but you can smile through your words occasionally. A light touch here and there is fine, but don't force it.";
  } else if (humorLevel <= 60) {
    humorStyle = "Mix in casual humor naturally. Throw in a witty observation or playful comment when the moment calls for it, but don't overdo it.";
  } else if (humorLevel <= 80) {
    humorStyle = "Be notably playful and fun! Use humor frequently - make jokes, add funny asides, and keep the vibe light and entertaining.";
  } else {
    humorStyle = "Maximum entertainment mode! Be genuinely funny, make jokes, add amusing commentary, use playful exaggeration. Make conversations memorable and fun!";
  }

  // 5-level formality scale
  let formalityStyle = "";
  if (formalityLevel <= 20) {
    formalityStyle = "Ultra casual - talk like a close friend. Use contractions, casual expressions, maybe even slang. Keep it super relaxed and chill.";
  } else if (formalityLevel <= 40) {
    formalityStyle = "Relaxed and conversational. Use everyday language, contractions are fine, feel approachable and easy to talk to.";
  } else if (formalityLevel <= 60) {
    formalityStyle = "Balanced tone - conversational but clear. Not stiff, not slangy. Adapt based on what the user seems to prefer.";
  } else if (formalityLevel <= 80) {
    formalityStyle = "Polished and articulate. Use proper grammar, avoid slang, maintain professionalism while still being personable.";
  } else {
    formalityStyle = "Highly formal and refined. Proper language, complete sentences, professional demeanor. Think executive assistant or consultant.";
  }

  const selectedPersonality = personalityStyles[personality] || personalityStyles.balanced;

  return `
## YOUR IDENTITY: ${aiName}

You are ${aiName}, a personal AI assistant. Your personality and communication style are CRUCIAL to every response you give.

## YOUR PERSONALITY TYPE: ${personality.toUpperCase()}
${selectedPersonality}

## YOUR HUMOR LEVEL: ${humorLevel}%
${humorStyle}

## YOUR FORMALITY LEVEL: ${formalityLevel}%
${formalityStyle}

## CRITICAL PERSONALITY RULES:
1. EVERY response must reflect your personality settings - this is non-negotiable
2. Start responses in a way that matches your personality (friendly greeting, witty opener, professional acknowledgment, etc.)
3. Maintain consistent tone throughout - don't randomly switch styles mid-response
4. Your personality should shine through even in informational answers
5. If you reference yourself, use your name "${aiName}" not "I'm an AI" or "As an assistant"
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = body.messages.map((msg: { role?: string; content?: string }) => {
      if (!msg.role || !msg.content) {
        throw new Error("Invalid message structure");
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new Error("Invalid message role");
      }
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
    
    console.log(`AI Settings - Name: ${aiName}, Personality: ${aiPersonality}, Humor: ${humorLevel}, Formality: ${formalityLevel}`);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build user context section
    let userContextSection = "";
    if (userContext) {
      const { profile, preferences, tasks } = userContext;
      
      if (profile) {
        const userName = profile.full_name || "the user";
        userContextSection += `\n[USER_INFO]\n`;
        if (profile.full_name) userContextSection += `Name: ${profile.full_name}\n`;
        if (profile.city || profile.country) {
          userContextSection += `Location: ${[profile.city, profile.country].filter(Boolean).join(", ")}\n`;
        }
        if (profile.age_range) userContextSection += `Age: ${profile.age_range}\n`;
        if (profile.household_type) userContextSection += `Household: ${profile.household_type}\n`;
      }
      
      if (preferences) {
        if (preferences.dietary_preferences?.length > 0) {
          userContextSection += `Diet: ${preferences.dietary_preferences.join(", ")}\n`;
        }
        if (preferences.interests?.length > 0) {
          userContextSection += `Interests: ${preferences.interests.join(", ")}\n`;
        }
      }
      
      if (tasks && tasks.length > 0) {
        const pendingTasks = tasks.filter((t: { completed: boolean }) => !t.completed);
        if (pendingTasks.length > 0) {
          userContextSection += `Pending tasks: ${pendingTasks.map((t: { title: string }) => t.title).join(", ")}\n`;
        }
      }
      
      if (userContextSection) {
        userContextSection += `[/USER_INFO]\n`;
      }
    }

    // Fetch live context
    const userCity = userContext?.profile?.city;
    const userCountry = userContext?.profile?.country;
    const liveWorldContext = await fetchLiveContext(userCity, userCountry);

    // Web search if needed
    let webSearchContext = "";
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === "user").pop();
    if (lastUserMessage && needsWebSearch(lastUserMessage.content)) {
      webSearchContext = await searchWeb(lastUserMessage.content);
    }

    // Build the personality-first system prompt
    const personalityPrompt = buildPersonalityPrompt(aiName, aiPersonality, humorLevel, formalityLevel);

    const systemPrompt = `${personalityPrompt}

## WHAT YOU CAN DO:
You're a brilliant, versatile AI that can discuss ANYTHING: general knowledge, current events, creative tasks, technical topics, lifestyle advice, entertainment, professional guidance, education, and casual fun.

## CONTEXT AVAILABLE TO YOU:
${userContextSection}
${liveWorldContext}
${webSearchContext}

## RESPONSE GUIDELINES:
- Answer questions thoroughly using any web search results provided
- Use the user's info and interests to personalize when relevant
- Keep responses concise but complete (aim for 2-4 paragraphs unless more detail is needed)
- Use markdown formatting when it helps readability
- NEVER say you can't help with something - you're a general-purpose AI
- If you don't have specific info, provide your best knowledgeable response

## REMEMBER:
Your personality settings (${aiPersonality}, humor ${humorLevel}%, formality ${formalityLevel}%) must come through in EVERY response. Be ${aiName}, not a generic assistant!`;

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
        temperature: 0.8, // Slightly higher for more personality variation
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
