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

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const systemPrompt = `You are a cost of living analyst with access to current economic data. Your estimates must be based on:
- Bureau of Labor Statistics (BLS) Consumer Price Index data
- Council for Community and Economic Research (C2ER) Cost of Living Index
- Regional price parities from the Bureau of Economic Analysis
- Current local utility rates, gas prices, and grocery store averages

Be precise and conservative. Use real-world price ranges, not rounded estimates. Account for regional variations within cities.`;

    const userPrompt = `Provide accurate monthly cost estimates for a ${household} household in ${location} as of ${currentDate}.

IMPORTANT: Base your estimates on actual regional data, not national averages. Consider:
- Local grocery chains and their typical prices (H-E-B, Kroger, Walmart, etc.)
- Current gas prices in the region (check AAA averages for the state)
- Local utility providers and their current rates
- Regional restaurant pricing (fast food vs casual dining averages)
- Local entertainment costs (movies, streaming, activities)

For household type "${household}":
- Single adult: 1 person
- Couple: 2 adults
- Family: 2 adults + 2 children
- Adjust quantities accordingly

Return ONLY a JSON object with this exact structure:
{
  "insights": [
    {
      "category": "Groceries",
      "averageCost": <precise monthly average in USD based on regional grocery prices>,
      "trend": "<up|down|stable based on recent 6-month price trends>",
      "tip": "<specific local tip mentioning actual stores or strategies for this area>"
    }
  ],
  "budgetTips": [
    {
      "title": "<specific actionable tip>",
      "savings": "<realistic monthly savings estimate>",
      "description": "<detailed implementation specific to ${location}>"
    }
  ]
}

Categories to include with regional accuracy:
1. Groceries - based on local supermarket prices (mention specific chains if relevant)
2. Gas - use current state average gas price × typical monthly usage (single: 40gal, couple: 60gal, family: 80gal)
3. Dining Out - mix of fast food ($10-15) and casual dining ($20-35 per person)
4. Utilities - electric, water, gas, internet based on local provider rates
5. Entertainment - streaming services, movies, local activities

Include 3-4 budget tips specific to ${location} (mention local resources, discount stores, programs).`;

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
        temperature: 0.2,
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
