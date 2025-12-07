import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GasPriceRequest {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

// Regional base prices based on US gas price averages by state/region
const regionalBasePrices: Record<string, number> = {
  // West Coast (highest prices)
  'california': 4.50,
  'ca': 4.50,
  'hawaii': 4.40,
  'hi': 4.40,
  'washington': 3.90,
  'wa': 3.90,
  'oregon': 3.80,
  'or': 3.80,
  'nevada': 3.70,
  'nv': 3.70,
  'alaska': 3.60,
  'ak': 3.60,
  // Northeast
  'new york': 3.40,
  'ny': 3.40,
  'massachusetts': 3.35,
  'ma': 3.35,
  'connecticut': 3.30,
  'ct': 3.30,
  'pennsylvania': 3.25,
  'pa': 3.25,
  'new jersey': 3.20,
  'nj': 3.20,
  // Midwest
  'illinois': 3.30,
  'il': 3.30,
  'michigan': 3.15,
  'mi': 3.15,
  'ohio': 2.95,
  'oh': 2.95,
  'indiana': 2.90,
  'in': 2.90,
  // South (generally lower)
  'florida': 3.10,
  'fl': 3.10,
  'georgia': 2.85,
  'ga': 2.85,
  'north carolina': 2.90,
  'nc': 2.90,
  'south carolina': 2.80,
  'sc': 2.80,
  'virginia': 2.95,
  'va': 2.95,
  // Gulf states (lowest prices)
  'texas': 2.65,
  'tx': 2.65,
  'louisiana': 2.60,
  'la': 2.60,
  'oklahoma': 2.55,
  'ok': 2.55,
  'mississippi': 2.55,
  'ms': 2.55,
  'alabama': 2.60,
  'al': 2.60,
  'arkansas': 2.60,
  'ar': 2.60,
  // Mountain states
  'colorado': 3.10,
  'co': 3.10,
  'arizona': 3.20,
  'az': 3.20,
  'utah': 3.15,
  'ut': 3.15,
  'new mexico': 2.90,
  'nm': 2.90,
};

function getRegionalBasePrice(state?: string, city?: string): number {
  const defaultPrice = 2.95;
  
  if (state) {
    const stateLower = state.toLowerCase().trim();
    if (regionalBasePrices[stateLower]) {
      return regionalBasePrices[stateLower];
    }
  }
  
  // Try to extract state from city if it contains state info
  if (city) {
    const cityLower = city.toLowerCase();
    for (const [region, price] of Object.entries(regionalBasePrices)) {
      if (cityLower.includes(region)) {
        return price;
      }
    }
  }
  
  return defaultPrice;
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

    const { lat, lng, city, state }: GasPriceRequest = await req.json();

    if (!lat || !lng) {
      throw new Error("Latitude and longitude are required");
    }

    console.log(`Fetching gas prices for lat: ${lat}, lng: ${lng}, city: ${city || 'unknown'}, state: ${state || 'unknown'}`);

    // Get regional base price
    const basePrice = getRegionalBasePrice(state, city);
    console.log(`Using regional base price: $${basePrice} for ${state || city || 'default region'}`);


    // Use HERE Fuel Prices API v3 to get nearby stations
    const url = `https://fuel.hereapi.com/v3/stations?in=circle:${lat},${lng};r=16000&showallstations=true&apiKey=${HERE_API_KEY}`;
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

    // Generate simulated prices based on brand (cheaper brands get lower prices)
    const brandPriceModifiers: Record<string, number> = {
      'Costco': -0.30,
      "Sam's Club": -0.25,
      'Walmart': -0.20,
      'Murphy USA': -0.15,
      'QT': -0.10,
      'QuikTrip': -0.10,
      'Kroger': -0.10,
      'H-E-B': -0.08,
      'RaceTrac': -0.05,
      'Sheetz': -0.05,
      'Wawa': -0.03,
      'Shell': 0.10,
      'Chevron': 0.12,
      'Exxon': 0.08,
      'Mobil': 0.08,
      'BP': 0.05,
      'Texaco': 0.05,
    };

    const stations = stationsData.slice(0, 15).map((station: any, index: number) => {
      const brand = station.brand || station.name || 'Gas Station';
      
      // Find price modifier for this brand
      let modifier = 0;
      for (const [brandName, mod] of Object.entries(brandPriceModifiers)) {
        if (brand.toLowerCase().includes(brandName.toLowerCase())) {
          modifier = mod;
          break;
        }
      }
      
      // Add small random variation (-0.05 to +0.05)
      const randomVariation = (Math.random() - 0.5) * 0.10;
      const simulatedPrice = Math.round((basePrice + modifier + randomVariation) * 100) / 100;
      
      // Build address
      const address = station.address;
      const addressStr = address?.label || 
        (address ? `${address.street || ''} ${address.houseNumber || ''}, ${address.city || ''}`.trim() : 'Address unavailable');

      // Convert distance from meters to miles
      const distanceMiles = station.distance ? (station.distance / 1609.34).toFixed(1) : null;

      // Simulate price trend based on brand tier
      const priceChange = modifier < -0.10 ? 'down' : modifier > 0.05 ? 'up' : 'same';

      return {
        id: station.id || `station-${index}`,
        name: brand,
        address: addressStr,
        distance: distanceMiles ? `${distanceMiles} mi` : 'Nearby',
        price: simulatedPrice,
        priceChange: priceChange as 'up' | 'down' | 'same'
      };
    });

    // Sort by price (cheapest first)
    stations.sort((a: any, b: any) => a.price - b.price);

    return new Response(
      JSON.stringify({ 
        success: true,
        stations: stations.slice(0, 10),
        note: "Prices are estimates based on brand averages"
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
