import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceRequest {
  type: "food" | "activities";
  latitude: number;
  longitude: number;
  dietary?: string[];
  interests?: string[];
  radius?: number;
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

    const { type, latitude, longitude, dietary, interests, radius = 5000 }: PlaceRequest = await req.json();

    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    // Determine place types based on request
    let includedTypes: string[] = [];
    let textQuery = "";
    
    if (type === "food") {
      includedTypes = ["restaurant", "cafe", "bakery", "meal_takeaway"];
      // Filter out "none" and empty values, then add dietary preferences to query
      const validDietary = dietary?.filter(d => d && d.toLowerCase() !== 'none') || [];
      if (validDietary.length > 0) {
        textQuery = validDietary.join(" ") + " restaurant";
      }
    } else if (type === "activities") {
      // Use a variety of activity types
      includedTypes = [
        "museum", "art_gallery", "park", "tourist_attraction",
        "movie_theater", "bowling_alley", "gym", "spa",
        "night_club", "bar", "shopping_mall", "zoo", "aquarium",
        "amusement_park", "stadium", "library", "casino"
      ];
      // Don't use interest-based text query to get more variety
      textQuery = "";
    }

    let places = [];

    // Use Text Search if we have a query, otherwise use Nearby Search
    if (textQuery) {
      const textSearchUrl = "https://places.googleapis.com/v1/places:searchText";
      
      const textSearchBody = {
        textQuery: textQuery,
        locationBias: {
          circle: {
            center: { latitude, longitude },
            radius: radius
          }
        },
        maxResultCount: 10
      };

      const textSearchResponse = await fetch(textSearchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.primaryType,places.location"
        },
        body: JSON.stringify(textSearchBody)
      });

      if (!textSearchResponse.ok) {
        const errorText = await textSearchResponse.text();
        console.error("Text search error:", errorText);
        throw new Error(`Google Places API error: ${textSearchResponse.status}`);
      }

      const textData = await textSearchResponse.json();
      places = textData.places || [];
    } else {
      // Use Nearby Search
      const nearbyUrl = "https://places.googleapis.com/v1/places:searchNearby";
      
      const nearbyBody = {
        includedTypes: includedTypes.slice(0, 5), // API limits types
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: radius
          }
        },
        maxResultCount: 10
      };

      const nearbyResponse = await fetch(nearbyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.primaryType,places.location"
        },
        body: JSON.stringify(nearbyBody)
      });

      if (!nearbyResponse.ok) {
        const errorText = await nearbyResponse.text();
        console.error("Nearby search error:", errorText);
        throw new Error(`Google Places API error: ${nearbyResponse.status}`);
      }

      const nearbyData = await nearbyResponse.json();
      places = nearbyData.places || [];
    }

    // Calculate distances and format response
    const formattedPlaces = places.map((place: any) => {
      const placeLat = place.location?.latitude;
      const placeLng = place.location?.longitude;
      let distance = "N/A";
      
      if (placeLat && placeLng) {
        // Calculate distance using Haversine formula
        const R = 3959; // Earth's radius in miles
        const dLat = (placeLat - latitude) * Math.PI / 180;
        const dLon = (placeLng - longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(placeLat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        distance = `${d.toFixed(1)} mi`;
      }

      // Map price level to dollar signs
      const priceMap: Record<string, string> = {
        "PRICE_LEVEL_FREE": "Free",
        "PRICE_LEVEL_INEXPENSIVE": "$",
        "PRICE_LEVEL_MODERATE": "$$",
        "PRICE_LEVEL_EXPENSIVE": "$$$",
        "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$"
      };

      // Determine match reason based on place type and user interests
      let matchReason = "";
      let isInterestMatch = false;
      
      if (type === "food") {
        // Filter out "none" values and use valid preferences
        const validDietary = dietary?.filter(d => d && d.toLowerCase() !== 'none') || [];
        if (validDietary.length > 0) {
          matchReason = `Matches your ${validDietary.join(', ')} preference`;
          isInterestMatch = true;
        }
      } else if (type === "activities") {
        // Check if place type matches any user interest with STRICT mappings
        const placeType = (place.primaryType || "").toLowerCase().replace(/_/g, " ");
        const placeName = (place.displayName?.text || "").toLowerCase();
        
        // Define strict interest-to-place mappings (no overlaps)
        const interestMappings: Record<string, string[]> = {
          "music": ["concert hall", "music venue", "live music", "jazz club", "night club"],
          "movies": ["movie theater", "cinema", "drive in movie"],
          "art": ["art gallery", "art museum", "art center", "art studio"],
          "tech": ["science museum", "tech museum", "planetarium", "science center"],
          "fitness": ["gym", "fitness center", "yoga studio", "crossfit", "pilates"],
          "sports": ["stadium", "arena", "sports complex", "bowling alley", "golf course", "tennis court"],
          "nature": ["park", "zoo", "aquarium", "botanical garden", "nature reserve", "hiking trail"],
          "gaming": ["arcade", "gaming center", "esports", "laser tag"],
          "shopping": ["shopping mall", "outlet", "shopping center"],
          "wellness": ["spa", "massage", "wellness center", "sauna"],
          "reading": ["library", "bookstore", "book shop"],
          "food": ["restaurant", "cafe", "bakery", "food hall"],
          "nightlife": ["bar", "nightclub", "lounge", "pub"],
          "history": ["museum", "historical site", "monument", "heritage"],
          "comedy": ["comedy club", "comedy theater", "improv"],
          "theater": ["theater", "performing arts", "opera house", "playhouse"],
          "photography": ["gallery", "photo studio", "camera"],
          "travel": ["tourist attraction", "landmark", "viewpoint"],
          "amusement": ["amusement park", "theme park", "carnival", "fair"],
          "casino": ["casino", "gambling"]
        };
        
        if (interests?.length) {
          const matchedInterest = interests.find(interest => {
            const interestLower = interest.toLowerCase();
            const mappedPlaceTypes = interestMappings[interestLower] || [];
            
            // Check if place type or name contains any of the mapped terms
            return mappedPlaceTypes.some(mappedType => 
              placeType.includes(mappedType) || placeName.includes(mappedType)
            ) || 
            // Also check direct match
            placeType.includes(interestLower) || 
            placeName.includes(interestLower);
          });
          
          if (matchedInterest) {
            matchReason = `Based on your interest in ${matchedInterest}`;
            isInterestMatch = true;
          }
        }
      }

      return {
        id: place.id,
        name: place.displayName?.text || "Unknown",
        type: place.primaryType?.replace(/_/g, " ") || "Place",
        address: place.formattedAddress || "Address not available",
        rating: place.rating || 0,
        priceRange: priceMap[place.priceLevel] || "$$",
        distance,
        matchReason,
        isInterestMatch
      };
    });

    // Sort places: interest matches first, then by rating
    formattedPlaces.sort((a: any, b: any) => {
      if (a.isInterestMatch && !b.isInterestMatch) return -1;
      if (!a.isInterestMatch && b.isInterestMatch) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    return new Response(JSON.stringify({ places: formattedPlaces }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in google-places function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
