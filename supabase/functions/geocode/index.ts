import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodeRequest {
  city?: string;
  state?: string;
  zipCode?: string;
  address?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_PLACES_API_KEY is not configured");
    }

    const body: GeocodeRequest = await req.json();
    const { city, state, zipCode, address: providedAddress } = body;

    // Build address string - prioritize zip code, then provided address, then city/state
    let address = "";
    
    if (zipCode) {
      // Zip code is most precise
      address = zipCode;
      if (state) address += `, ${state}`;
    } else if (providedAddress) {
      address = providedAddress;
    } else if (city) {
      address = city;
      if (state) address += `, ${state}`;
    } else {
      throw new Error("Either zipCode, address, or city is required");
    }

    console.log("Geocoding address:", address);

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results?.[0]) {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const location = data.results[0].geometry.location;

    return new Response(
      JSON.stringify({ 
        latitude: location.lat, 
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in geocode function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
