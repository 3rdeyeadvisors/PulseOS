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

    // Use HERE Fuel Prices API v3 with fueltype=3 (Regular Unleaded) to get prices
    // fueltype 3 = Regular Unleaded, 1 = Diesel, 27 = Premium
    const url = `https://fuel.hereapi.com/v3/stations?in=circle:${lat},${lng};r=16000&fueltype=3&showallstations=true&apiKey=${HERE_API_KEY}`;
    console.log("Requesting URL:", url.replace(HERE_API_KEY, "***"));
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HERE API error:", response.status, errorText);
      throw new Error(`Gas price API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Stations count from API:", data.count || data.stations?.length || 0);

    // Handle response format
    const stationsData = data.stations || [];

    const stations = stationsData.slice(0, 15).map((station: any, index: number) => {
      // Get fuel prices
      const fuelPrices = station.fuelPrice || [];
      const regularFuel = fuelPrices.find((f: any) => 
        f.fuelType === '3' || f.fuelType === 3
      ) || fuelPrices[0];

      const price = regularFuel?.price || null;
      
      // Build address
      const address = station.address;
      const addressStr = address?.label || 
        (address ? `${address.street || ''} ${address.houseNumber || ''}, ${address.city || ''}`.trim() : 'Address unavailable');

      // Convert distance from meters to miles
      const distanceMiles = station.distance ? (station.distance / 1609.34).toFixed(1) : null;

      return {
        id: station.id || `station-${index}`,
        name: station.brand || station.name || 'Gas Station',
        address: addressStr,
        distance: distanceMiles ? `${distanceMiles} mi` : 'Nearby',
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

    // Filter to only show stations with prices first, then add some without
    const stationsWithPrices = stations.filter((s: any) => s.price !== null);
    const stationsWithoutPrices = stations.filter((s: any) => s.price === null).slice(0, 3);
    const finalStations = [...stationsWithPrices.slice(0, 10), ...stationsWithoutPrices].slice(0, 10);

    return new Response(
      JSON.stringify({ 
        success: true,
        stations: finalStations,
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
