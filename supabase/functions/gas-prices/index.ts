import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GasPriceRequest {
  lat: number;
  lng: number;
  city?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HERE_API_KEY = Deno.env.get("HERE_API_KEY");
    if (!HERE_API_KEY) {
      throw new Error("HERE_API_KEY is not configured");
    }

    const { lat, lng, city }: GasPriceRequest = await req.json();

    if (!lat || !lng) {
      throw new Error("Latitude and longitude are required");
    }

    console.log(`Fetching gas prices for lat: ${lat}, lng: ${lng}, city: ${city || 'unknown'}`);

    // Use HERE Fuel Prices API
    const response = await fetch(
      `https://fuel.cc.api.here.com/fuel/stations.json?prox=${lat},${lng},8000&apiKey=${HERE_API_KEY}`,
      {
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HERE API error:", response.status, errorText);
      throw new Error(`Gas price API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("HERE API response stations count:", data.stations?.length || 0);

    const stations = (data.stations || []).slice(0, 10).map((station: any, index: number) => {
      // Get regular gas price (usually the first fuel type)
      const regularFuel = station.fuels?.find((f: any) => 
        f.type?.toLowerCase().includes('regular') || 
        f.type?.toLowerCase().includes('unleaded') ||
        f.type?.toLowerCase() === 'e10'
      ) || station.fuels?.[0];

      const price = regularFuel?.price || null;
      
      return {
        id: station.id || `station-${index}`,
        name: station.brand || station.name || 'Gas Station',
        address: station.address?.text || station.address?.street || 'Address unavailable',
        distance: station.distance ? `${(station.distance / 1609.34).toFixed(1)} mi` : 'N/A',
        price: price ? parseFloat(price) : null,
        priceChange: 'same' as const
      };
    });

    // Sort by price (cheapest first), putting null prices at the end
    stations.sort((a: any, b: any) => {
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return a.price - b.price;
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        stations: stations,
        note: "Prices vary by region"
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
