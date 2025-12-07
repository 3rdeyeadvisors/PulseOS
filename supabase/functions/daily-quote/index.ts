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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { interests } = await req.json();

    const interestContext = interests?.length > 0 
      ? `User interests: ${interests.join(", ")}.` 
      : "";

    const systemPrompt = `You are an inspiring quote curator. Generate a unique, meaningful quote for the day.
${interestContext}
The quote should be uplifting, thought-provoking, or motivational. Mix famous quotes with lesser-known gems.`;

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
          { role: "user", content: "Give me one inspiring quote for today. Return the quote and the author." },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_quote",
              description: "Return an inspiring quote",
              parameters: {
                type: "object",
                properties: {
                  quote: { type: "string", description: "The quote text" },
                  author: { type: "string", description: "The author of the quote" },
                },
                required: ["quote", "author"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_quote" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const quoteData = JSON.parse(toolCall.function.arguments);
      console.log("Quote generated:", quoteData);
      return new Response(JSON.stringify(quoteData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid AI response format");
  } catch (error: unknown) {
    console.error("Quote generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
