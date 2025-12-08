import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dietaryPreferences, city } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Filter out "none" and empty values from dietary preferences
    const validDietary = (dietaryPreferences || []).filter(
      (d: string) => d && d.toLowerCase() !== 'none'
    );

    const dietaryContext = validDietary.length > 0
      ? `User dietary preferences: ${validDietary.join(", ")}. Only suggest foods that match these dietary restrictions.`
      : "No specific dietary restrictions.";

    const locationContext = city 
      ? `User is located in ${city}. Include real restaurant recommendations in ${city}.` 
      : "Suggest general meal ideas.";

    const systemPrompt = `You are a helpful food recommendation assistant. Suggest 3 food options for today.
${dietaryContext}
${locationContext}

When a city is provided, mix home cooking ideas with actual restaurant recommendations from that area. For restaurants, include the real restaurant name and a signature dish.`;

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
          { role: "user", content: `Give me 3 food recommendations. Include at least one local restaurant if a city is known. Be concise - dish/restaurant name and brief description (under 12 words each).` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_foods",
              description: "Return 3 food recommendations including nearby restaurants",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Name of the dish or restaurant + dish" },
                        description: { type: "string", description: "Brief description under 12 words" },
                        mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
                        isRestaurant: { type: "boolean", description: "True if this is a restaurant recommendation" },
                      },
                      required: ["name", "description", "mealType", "isRestaurant"],
                    },
                  },
                },
                required: ["recommendations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_foods" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const recommendations = JSON.parse(toolCall.function.arguments);
      console.log("Food recommendations generated:", recommendations);
      return new Response(JSON.stringify(recommendations), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid AI response format");
  } catch (error: unknown) {
    console.error("Food recommendations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
