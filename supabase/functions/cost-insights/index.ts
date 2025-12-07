import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CostInsightsRequest {
  city: string;
  state?: string;
  householdType?: string;
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

    const { city, state, householdType }: CostInsightsRequest = await req.json();
    const location = state ? `${city}, ${state}` : city || "United States";
    const household = householdType || "single adult";

    console.log(`Fetching cost insights for ${location}, household: ${household}`);

    const systemPrompt = `You are a cost of living expert. Provide accurate, realistic monthly cost estimates based on current 2024-2025 data. Be specific to the location provided.`;

    const userPrompt = `For a ${household} household living in ${location}, provide cost of living insights.

Return a JSON object with this exact structure:
{
  "insights": [
    {
      "category": "Groceries",
      "averageCost": <number - monthly average in USD>,
      "trend": "<up|down|stable>",
      "tip": "<specific money-saving tip for this category in this location>"
    }
  ],
  "budgetTips": [
    {
      "title": "<actionable tip title>",
      "savings": "<estimated monthly savings like $50/mo>",
      "description": "<specific description of how to implement>"
    }
  ]
}

Include these 5 categories in insights: Groceries, Gas, Dining Out, Utilities, Entertainment.
Include 3-4 personalized budget tips based on the location's cost of living.
Make all numbers realistic for ${location} in 2024-2025.`;

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
        temperature: 0.3,
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
    
    console.log("AI response received, parsing...");

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr, "Content:", content);
      // Return fallback data
      parsed = {
        insights: [
          { category: "Groceries", averageCost: 400, trend: "up", tip: "Shop at discount stores" },
          { category: "Gas", averageCost: 150, trend: "stable", tip: "Use gas price apps" },
          { category: "Dining Out", averageCost: 250, trend: "up", tip: "Cook more at home" },
          { category: "Utilities", averageCost: 150, trend: "stable", tip: "Use LED bulbs" },
          { category: "Entertainment", averageCost: 100, trend: "stable", tip: "Look for free events" },
        ],
        budgetTips: [
          { title: "Meal Prep", savings: "$100/mo", description: "Batch cook on weekends" },
          { title: "Cancel Subscriptions", savings: "$30/mo", description: "Audit monthly subscriptions" },
          { title: "Use Coupons", savings: "$50/mo", description: "Use grocery store apps" },
        ],
      };
    }

    return new Response(JSON.stringify({
      success: true,
      location,
      ...parsed,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Cost insights error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
