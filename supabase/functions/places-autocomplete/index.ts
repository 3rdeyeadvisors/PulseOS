import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceSuggestion {
  placePrediction?: {
    text?: { text?: string };
    placeId?: string;
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
}

interface AutocompleteRequest {
  input: string;
  types?: string;
  getDetails?: boolean;
  placeId?: string;
}

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

interface PlaceData {
  addressComponents?: AddressComponent[];
  displayName?: { text: string };
}

// Extract address components from Places API (New) response
function extractAddressComponents(place: PlaceData) {
  const components: Record<string, string> = {};
  
  if (place.addressComponents) {
    for (const component of place.addressComponents) {
      const types = component.types || [];
      if (types.includes("locality")) {
        components.city = component.longText;
      } else if (types.includes("administrative_area_level_1")) {
        components.state = component.shortText;
        components.stateLong = component.longText;
      } else if (types.includes("country")) {
        components.country = component.longText;
      } else if (types.includes("postal_code")) {
        components.zipCode = component.longText;
      }
    }
  }
  
  return components;
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

    const body: AutocompleteRequest = await req.json();
    const { input, types = "(cities)", getDetails = false, placeId } = body;

    // If placeId is provided, fetch place details
    if (placeId && getDetails) {
      console.log("Fetching place details for:", placeId);
      
      const detailsResponse = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "addressComponents,displayName",
          },
        }
      );

      if (!detailsResponse.ok) {
        const errorText = await detailsResponse.text();
        console.error("Place details error:", detailsResponse.status, errorText);
        throw new Error(`Place details error: ${detailsResponse.status}`);
      }

      const placeData = await detailsResponse.json();
      console.log("Place details:", JSON.stringify(placeData).substring(0, 500));
      
      const addressComponents = extractAddressComponents(placeData);
      
      return new Response(
        JSON.stringify({ addressComponents }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!input || input.length < 2) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Autocomplete search:", input, "types:", types);

    // Map types to Places API (New) includedPrimaryTypes
    let includedPrimaryTypes: string[] = [];
    if (types === "(cities)") {
      includedPrimaryTypes = ["locality", "administrative_area_level_3", "postal_town"];
    } else if (types === "(regions)") {
      includedPrimaryTypes = ["administrative_area_level_1", "administrative_area_level_2"];
    } else if (types === "country") {
      includedPrimaryTypes = ["country"];
    }

    // Use Places API (New) - Autocomplete endpoint
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Places API error:", response.status, errorText);
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Places API response:", JSON.stringify(data).substring(0, 500));

    const predictions = (data.suggestions || []).map((s: PlaceSuggestion) => {
      const place = s.placePrediction;
      return {
        description: place?.text?.text || "",
        placeId: place?.placeId || "",
        mainText: place?.structuredFormat?.mainText?.text || place?.text?.text || "",
        secondaryText: place?.structuredFormat?.secondaryText?.text || "",
      };
    });

    return new Response(
      JSON.stringify({ predictions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in places-autocomplete function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
