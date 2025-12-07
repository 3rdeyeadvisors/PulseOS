import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GasPriceRequest {
  state: string;
  city?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GAS_API_KEY = Deno.env.get("GAS_PRICES_API_KEY");
    if (!GAS_API_KEY) {
      throw new Error("GAS_PRICES_API_KEY is not configured");
    }

    const { state, city }: GasPriceRequest = await req.json();

    if (!state) {
      throw new Error("State is required");
    }

    console.log(`Fetching gas prices for state: ${state}, city: ${city || 'all'}`);

    // Get state-level gas prices with city breakdown
    const response = await fetch(
      `https://api.collectapi.com/gasPrice/stateUsaPrice?state=${encodeURIComponent(state)}`,
      {
        headers: {
          "authorization": `apikey ${GAS_API_KEY}`,
          "content-type": "application/json"
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CollectAPI error:", response.status, errorText);
      throw new Error(`Gas price API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("API response:", JSON.stringify(data));

    if (!data.success || !data.result) {
      throw new Error("Invalid response from gas price API");
    }

    const { state: stateData, cities } = data.result;

    // Format the response with state average and city prices
    const formattedData = {
      stateAverage: {
        name: stateData.name,
        gasoline: parseFloat(stateData.gasoline),
        midGrade: parseFloat(stateData.midGrade),
        premium: parseFloat(stateData.premium),
        diesel: parseFloat(stateData.diesel),
        currency: stateData.currency
      },
      cities: (cities || []).map((c: any) => ({
        name: c.name,
        gasoline: parseFloat(c.gasoline),
        midGrade: parseFloat(c.midGrade),
        premium: parseFloat(c.premium),
        diesel: parseFloat(c.diesel),
        currency: c.currency
      }))
    };

    // If a specific city is requested, try to find it
    let userCity = null;
    if (city) {
      userCity = formattedData.cities.find(
        (c: any) => c.name.toLowerCase() === city.toLowerCase()
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        stateAverage: formattedData.stateAverage,
        cities: formattedData.cities.slice(0, 10), // Return top 10 cities
        userCity: userCity
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in gas-prices function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
